//! 业务命令：登录 / 列表 / 详情 / 播放 / 互动。

use crate::net::{base, edge};
use crate::session::SessionStore;
use serde_json::{json, Value};
use tauri::State;
use tauri_plugin_opener::OpenerExt;

pub struct Api {
    pub session: SessionStore,
}

impl Api {
    pub fn new() -> Self {
        Self {
            session: SessionStore::new(),
        }
    }

    async fn get(&self, path: &str) -> Result<Value, String> {
        let origin = base();
        let token = self.session.token(&origin);
        edge(&origin, "GET", path, None, token.as_deref()).await
    }

    async fn authed(&self, method: &str, path: &str, body: Option<Value>) -> Result<Value, String> {
        let origin = base();
        let token = self
            .session
            .token(&origin)
            .ok_or_else(|| "请先登录".to_string())?;
        edge(&origin, method, path, body, Some(&token)).await
    }

    async fn post_playback(&self, path: &str) -> Result<Value, String> {
        let origin = base();
        let token = if crate::net::trusted_auth_origin(&origin)
            || !crate::network_policy::strict_security()
        {
            self.session.token(&origin)
        } else {
            None
        };
        edge(&origin, "POST", path, Some(json!({})), token.as_deref()).await
    }
}

/// API/运行错误与自检统一写入 debug.log，每行附 RFC 3339 UTC 时间和进程编号。
#[tauri::command]
pub async fn debug_log(app: tauri::AppHandle, msg: String) -> Result<(), String> {
    use tauri::Manager;
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    crate::logging::append_debug(&dir, &msg)
}

/// 网络自检：系统代理 / DNS / 连通性快照，用于远程定位「打不开」。
#[tauri::command]
pub async fn net_diag() -> Result<Value, String> {
    Ok(crate::net::diagnose().await)
}

/* ───────────────────────── 线路（数据源） ───────────────────────── */

/// 当前线路 + 固定线路清单（镜像线路另外按需拉取）。
#[tauri::command]
pub async fn line_state() -> Result<Value, String> {
    Ok(json!({
        "base": base(),
        "default": crate::net::DEFAULT_BASE,
        "fixed": crate::lines::fixed(),
    }))
}

/// 手动切换线路：立即生效并落盘（下次启动沿用）。
#[tauri::command]
pub async fn line_set(state: State<'_, Api>, url: String) -> Result<String, String> {
    let previous = base();
    let next = crate::net::set_base(&url)?;
    if previous != next {
        state.session.clear();
    }
    Ok(next)
}

/// 从地址发布页抓镜像线路（只在用户点开「线路」时调用）。
#[tauri::command]
pub async fn line_mirrors() -> Result<Value, String> {
    // 用户手动点「刷新 / 打开线路」时重新读一次系统代理：代理软件开关过之后旧客户端会卡死
    crate::net::refresh_client();
    crate::lines::mirrors().await
}

/// 可达性探测：只报结果，不做自动检查 / 自动切换。
#[tauri::command]
pub async fn line_probe(urls: Vec<String>) -> Result<Value, String> {
    crate::net::refresh_client();
    Ok(crate::lines::probe(urls).await)
}

/* ───────────────────────── 更新检查 ───────────────────────── */

const REPO: &str = "LNPANDY/HGhub-MacOS-iOS-Version";

fn ver_parts(v: &str) -> Vec<u64> {
    v.trim()
        .trim_start_matches(['v', 'V'])
        .split(['.', '-', '+'])
        .map(|s| s.trim().parse::<u64>().unwrap_or(0))
        .collect()
}

/// 只比较数字段：`v1.2.0` > `1.1.9`；解析不出的段按 0 处理。
fn is_newer(latest: &str, current: &str) -> bool {
    let (a, b) = (ver_parts(latest), ver_parts(current));
    for i in 0..a.len().max(b.len()) {
        let x = *a.get(i).unwrap_or(&0);
        let y = *b.get(i).unwrap_or(&0);
        if x != y {
            return x > y;
        }
    }
    false
}

/// 对比 GitHub Release 的 tag 与当前版本（未认证 60 次/小时/IP，够用）。
#[tauri::command]
pub async fn check_update() -> Result<Value, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();
    let url = format!("https://api.github.com/repos/{REPO}/releases/latest");
    let resp = crate::net::get(
        &url,
        std::time::Duration::from_secs(12),
        Some("application/vnd.github+json"),
        None,
    )
    .await?;

    let status = resp.status();
    if status.as_u16() == 404 {
        // 还没发过 release
        return Ok(json!({
            "current": current, "latest": "", "has_update": false,
            "url": format!("https://github.com/{REPO}/releases"),
        }));
    }
    if !status.is_success() {
        return Err(format!("GitHub 返回 HTTP {status}"));
    }

    let v: Value = resp.json().await.map_err(|e| crate::net::err_text(&e))?;
    let tag = v
        .get("tag_name")
        .and_then(|x| x.as_str())
        .unwrap_or("")
        .to_string();
    let html = v
        .get("html_url")
        .and_then(|x| x.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("https://github.com/{REPO}/releases"));
    let notes = v.get("body").and_then(|x| x.as_str()).unwrap_or("");

    Ok(json!({
        "current": current,
        "latest": tag.trim_start_matches(['v', 'V']).to_string(),
        "tag": tag,
        "has_update": !tag.is_empty() && is_newer(&tag, &current),
        "url": html,
        "name": v.get("name").and_then(|x| x.as_str()).unwrap_or(""),
        "published_at": v.get("published_at").and_then(|x| x.as_str()).unwrap_or(""),
        "notes": notes.chars().take(800).collect::<String>(),
    }))
}

/// 用系统默认浏览器打开链接（只允许 http/https）。
#[tauri::command]
pub async fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let target = crate::network_policy::parse_target(&url)?;
    // 固定使用默认处理器；不向前端暴露可指定程序的 opener 命令。
    app.opener()
        .open_url(target.as_str(), None::<&str>)
        .map_err(|e| e.to_string())
}

/// 切换移动端屏幕方向（iOS 原生旋转屏幕方向：横屏 Landscape / 竖屏 Portrait）。
#[tauri::command]
pub async fn set_orientation(app: tauri::AppHandle, landscape: bool) -> Result<(), String> {
    #[cfg(target_os = "ios")]
    {
        let _ = app.run_on_main_thread(move || {
            request_ios_orientation(landscape);
        });
    }
    #[cfg(not(target_os = "ios"))]
    {
        let _ = (&app, landscape);
    }
    Ok(())
}

#[cfg(target_os = "ios")]
fn request_ios_orientation(landscape: bool) {
    use std::ffi::{c_char, c_void};
    extern "C" {
        fn objc_getClass(name: *const c_char) -> *mut c_void;
        fn sel_registerName(name: *const c_char) -> *mut c_void;
        fn objc_msgSend();
    }
    unsafe {
        let msg0: unsafe extern "C" fn(*mut c_void, *mut c_void) -> *mut c_void =
            std::mem::transmute(objc_msgSend as *const ());
        let msg0_usize: unsafe extern "C" fn(*mut c_void, *mut c_void) -> usize =
            std::mem::transmute(objc_msgSend as *const ());
        let msg1_usize: unsafe extern "C" fn(*mut c_void, *mut c_void, usize) -> *mut c_void =
            std::mem::transmute(objc_msgSend as *const ());
        let msg2_ptr: unsafe extern "C" fn(*mut c_void, *mut c_void, *mut c_void, *mut c_void) =
            std::mem::transmute(objc_msgSend as *const ());
        let msg1_void: unsafe extern "C" fn(*mut c_void, *mut c_void) =
            std::mem::transmute(objc_msgSend as *const ());

        // 1. iOS 16+ UIWindowScene.requestGeometryUpdateWithPreferences:errorHandler:
        // UIInterfaceOrientationMaskPortrait = 1 << 1 = 2
        // UIInterfaceOrientationMaskLandscapeRight = 1 << 3 = 8
        let mask: usize = if landscape { 8 } else { 2 };
        let prefs_cls = objc_getClass(b"UIWindowSceneGeometryPreferencesIOS\0".as_ptr() as *const c_char);
        let app_cls = objc_getClass(b"UIApplication\0".as_ptr() as *const c_char);
        if !prefs_cls.is_null() && !app_cls.is_null() {
            let sel_alloc = sel_registerName(b"alloc\0".as_ptr() as *const c_char);
            let sel_init = sel_registerName(b"initWithInterfaceOrientations:\0".as_ptr() as *const c_char);
            let raw_prefs = msg0(prefs_cls, sel_alloc);
            let prefs = if !raw_prefs.is_null() {
                msg1_usize(raw_prefs, sel_init, mask)
            } else {
                std::ptr::null_mut()
            };

            let sel_shared = sel_registerName(b"sharedApplication\0".as_ptr() as *const c_char);
            let app = msg0(app_cls, sel_shared);
            if !app.is_null() && !prefs.is_null() {
                let sel_scenes = sel_registerName(b"connectedScenes\0".as_ptr() as *const c_char);
                let scenes_set = msg0(app, sel_scenes);
                if !scenes_set.is_null() {
                    let sel_all = sel_registerName(b"allObjects\0".as_ptr() as *const c_char);
                    let arr = msg0(scenes_set, sel_all);
                    if !arr.is_null() {
                        let sel_count = sel_registerName(b"count\0".as_ptr() as *const c_char);
                        let sel_at = sel_registerName(b"objectAtIndex:\0".as_ptr() as *const c_char);
                        let sel_req = sel_registerName(
                            b"requestGeometryUpdateWithPreferences:errorHandler:\0".as_ptr() as *const c_char,
                        );
                        let sel_responds = sel_registerName(b"respondsToSelector:\0".as_ptr() as *const c_char);
                        let msg_responds: unsafe extern "C" fn(*mut c_void, *mut c_void, *mut c_void) -> bool =
                            std::mem::transmute(objc_msgSend as *const ());
                        let count = msg0_usize(arr, sel_count);
                        for i in 0..count {
                            let scene = msg1_usize(arr, sel_at, i);
                            if !scene.is_null() && msg_responds(scene, sel_responds, sel_req) {
                                msg2_ptr(scene, sel_req, prefs, std::ptr::null_mut());
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback: UIDevice setValue:forKey:@"orientation" + attemptRotationToDeviceOrientation
        let dev_cls = objc_getClass(b"UIDevice\0".as_ptr() as *const c_char);
        let num_cls = objc_getClass(b"NSNumber\0".as_ptr() as *const c_char);
        let str_cls = objc_getClass(b"NSString\0".as_ptr() as *const c_char);
        let vc_cls = objc_getClass(b"UIViewController\0".as_ptr() as *const c_char);
        if !dev_cls.is_null() && !num_cls.is_null() && !str_cls.is_null() {
            let sel_cur = sel_registerName(b"currentDevice\0".as_ptr() as *const c_char);
            let dev = msg0(dev_cls, sel_cur);
            let sel_num = sel_registerName(b"numberWithInteger:\0".as_ptr() as *const c_char);
            let orient_val: usize = if landscape { 3 } else { 1 };
            let num = msg1_usize(num_cls, sel_num, orient_val);
            let sel_str = sel_registerName(b"stringWithUTF8String:\0".as_ptr() as *const c_char);
            let msg_str: unsafe extern "C" fn(*mut c_void, *mut c_void, *const c_char) -> *mut c_void =
                std::mem::transmute(objc_msgSend as *const ());
            let key = msg_str(str_cls, sel_str, b"orientation\0".as_ptr() as *const c_char);
            if !dev.is_null() && !num.is_null() && !key.is_null() {
                let sel_set_val = sel_registerName(b"setValue:forKey:\0".as_ptr() as *const c_char);
                msg2_ptr(dev, sel_set_val, num, key);
            }
            if !vc_cls.is_null() {
                let sel_attempt = sel_registerName(b"attemptRotationToDeviceOrientation\0".as_ptr() as *const c_char);
                msg1_void(vc_cls, sel_attempt);
            }
        }
    }
}

/* ───────────────────────── 会话 ───────────────────────── */

#[tauri::command]
pub async fn app_boot(state: State<'_, Api>) -> Result<Value, String> {
    let origin = base();
    Ok(json!({
        "user": state.session.user(&origin),
        "logged_in": state.session.token(&origin).is_some(),
        "base": origin,
        "strict_security": crate::network_policy::strict_security(),
        "cli_relaxed": crate::network_policy::cli_strict_override() == Some(false),
    }))
}

/// 切换严格安全模式（关闭后回退到兼容清洗与网络守卫模式，立即生效并落盘）。
#[tauri::command]
pub async fn security_set(strict: bool) -> Result<bool, String> {
    crate::network_policy::set_strict_security(strict)?;
    crate::net::refresh_client();
    crate::playback_log::record(
        "security.mode_changed",
        json!({"strict": crate::network_policy::strict_security()}),
    );
    Ok(crate::network_policy::strict_security())
}

#[tauri::command]
pub async fn api_login(
    state: State<'_, Api>,
    username: String,
    password: String,
) -> Result<Value, String> {
    let origin = base();
    let data = edge(
        &origin,
        "POST",
        "/api/account/loginByPassword",
        Some(json!({ "username": username, "password": password })),
        None,
    )
    .await?;
    let token = data
        .get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "登录返回缺少 token".to_string())?
        .to_string();
    let user = data.get("user").cloned().unwrap_or(Value::Null);
    if base() != origin {
        return Err("登录期间线路已变化，请重新登录".into());
    }
    state.session.set(&origin, token, user.clone());
    Ok(json!({ "user": user }))
}

#[tauri::command]
pub async fn api_register(
    state: State<'_, Api>,
    username: String,
    password: String,
    email: String,
) -> Result<Value, String> {
    let origin = base();
    let mut body = json!({
        "username": username,
        "password": password,
        "confirm_password": password,
    });
    if !email.trim().is_empty() {
        body["email"] = json!(email);
    }
    let data = edge(
        &origin,
        "POST",
        "/api/account/registerByPassword",
        Some(body),
        None,
    )
    .await?;
    let token = data
        .get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "注册返回缺少 token".to_string())?
        .to_string();
    let user = data.get("user").cloned().unwrap_or(Value::Null);
    if base() != origin {
        return Err("注册期间线路已变化，请重新登录".into());
    }
    state.session.set(&origin, token, user.clone());
    Ok(json!({ "user": user }))
}

#[tauri::command]
pub async fn api_logout(state: State<'_, Api>) -> Result<Value, String> {
    let origin = base();
    let token = state.session.token(&origin);
    let _ = edge(
        &origin,
        "POST",
        "/api/account/logout",
        None,
        token.as_deref(),
    )
    .await;
    state.session.clear();
    Ok(json!({ "ok": true }))
}

#[tauri::command]
pub async fn api_me(state: State<'_, Api>) -> Result<Value, String> {
    let origin = base();
    let token = state.session.token(&origin);
    let me = edge(&origin, "GET", "/api/account/me", None, token.as_deref()).await?;
    if base() != origin {
        return Err("读取账号期间线路已变化".into());
    }
    if let Some(token) = state.session.token(&origin) {
        state.session.set(&origin, token, me.clone());
    }
    Ok(me)
}

/* ───────────────────────── 列表 ───────────────────────── */

#[tauri::command]
pub async fn api_feed(state: State<'_, Api>, page: u32, size: u32) -> Result<Value, String> {
    state
        .get(&format!("/api/videos?page={page}&size={size}"))
        .await
}

#[tauri::command]
pub async fn api_category(
    state: State<'_, Api>,
    cate: String,
    page: u32,
    size: u32,
) -> Result<Value, String> {
    state
        .get(&format!(
            "/api/videos/category/{cate}?page={page}&size={size}"
        ))
        .await
}

#[tauri::command]
pub async fn api_rank(state: State<'_, Api>, kind: String) -> Result<Value, String> {
    let kind = match kind.as_str() {
        "recommend" | "potential" => kind,
        _ => "hot".to_string(),
    };
    state.get(&format!("/api/ranks/{kind}")).await
}

#[tauri::command]
pub async fn api_search(
    state: State<'_, Api>,
    q: String,
    page: u32,
    size: u32,
) -> Result<Value, String> {
    let encoded: String = url::form_urlencoded::byte_serialize(q.as_bytes()).collect();
    state
        .get(&format!("/api/search?q={encoded}&page={page}&size={size}"))
        .await
}

#[tauri::command]
pub async fn api_posts(state: State<'_, Api>, page: u32, size: u32) -> Result<Value, String> {
    state
        .get(&format!("/api/posts?page={page}&size={size}"))
        .await
}

fn non_empty_str(v: Option<&Value>) -> Option<String> {
    v.and_then(|x| x.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
}

fn pick_stream_url(streams: Option<&Value>) -> Option<String> {
    let streams = streams?;
    non_empty_str(streams.get("main"))
        .or_else(|| non_empty_str(streams.get("hevc")))
        .or_else(|| non_empty_str(streams.get("preview")))
}

/// 将 `/api/videos/{id}/episodes/{ep}/playback` 返回的 `streams`/`cdn` 归一化为前端兼容结构。
pub(crate) fn normalize_video_playback(mut data: Value) -> Value {
    if let Some(cdn) = data.get("cdn") {
        crate::net::update_cdn_auth(cdn);
    }
    if !data.is_object() {
        return data;
    }
    if non_empty_str(data.get("video_url")).is_none() {
        if let Some(url) = pick_stream_url(data.get("streams")) {
            data["video_url"] = Value::String(url);
        }
    }
    if non_empty_str(data.get("video_url_hevc")).is_none() {
        if let Some(hevc) = non_empty_str(data.get("streams").and_then(|s| s.get("hevc"))) {
            data["video_url_hevc"] = Value::String(hevc);
        }
    }
    data
}

/// 将 `/api/posts/{id}/playback` 返回的视频列表/流与 CDN 鉴权回填到帖子详情中。
pub(crate) fn normalize_post_playback(mut post: Value, playback: Option<Value>) -> Value {
    if !post.is_object() {
        return post;
    }
    if non_empty_str(post.get("video_url")).is_some() {
        return post;
    }
    if let Some(pb) = playback {
        if let Some(cdn) = pb.get("cdn") {
            crate::net::update_cdn_auth(cdn);
        }
        let from_videos = pb
            .get("videos")
            .and_then(|v| v.as_array())
            .and_then(|arr| arr.iter().find_map(|item| non_empty_str(item.get("url"))));
        let url = from_videos
            .or_else(|| pick_stream_url(pb.get("streams")))
            .or_else(|| non_empty_str(pb.get("video_url")));
        if let Some(u) = url {
            post["video_url"] = Value::String(u);
        }
        if let Some(videos) = pb.get("videos") {
            if !videos.is_null() {
                post["videos"] = videos.clone();
            }
        }
    }
    post
}

#[tauri::command]
pub async fn api_post(state: State<'_, Api>, id: i64) -> Result<Value, String> {
    if id <= 0 {
        return Err("帖子 ID 无效".into());
    }
    let post = state.get(&format!("/api/posts/{id}")).await?;
    if non_empty_str(post.get("video_url")).is_some() {
        return Ok(post);
    }
    let playback = state
        .post_playback(&format!("/api/posts/{id}/playback"))
        .await
        .ok();
    Ok(normalize_post_playback(post, playback))
}

/* ───────────────────────── 详情 / 播放 ───────────────────────── */

#[tauri::command]
pub async fn api_video(state: State<'_, Api>, id: i64) -> Result<Value, String> {
    state.get(&format!("/api/videos/{id}")).await
}

#[tauri::command]
pub async fn api_play(state: State<'_, Api>, id: i64, ep: u32) -> Result<Value, String> {
    if id <= 0 || ep == 0 {
        return Err("视频 ID 或集数无效".into());
    }
    match state
        .post_playback(&format!("/api/videos/{id}/episodes/{ep}/playback"))
        .await
    {
        Ok(data) => Ok(normalize_video_playback(data)),
        Err(err) if err.starts_with("HTTP 404") => state
            .get(&format!("/api/videos/{id}/play?ep={ep}&page_texts=0"))
            .await
            .map(normalize_video_playback),
        Err(err) => Err(err),
    }
}

/* ───────────────────────── 评论 / 互动 ───────────────────────── */

#[tauri::command]
pub async fn api_comments(
    state: State<'_, Api>,
    id: i64,
    ep: u32,
    page: u32,
    size: u32,
) -> Result<Value, String> {
    state
        .get(&format!(
            "/api/videos/{id}/comments?ep={ep}&page={page}&size={size}"
        ))
        .await
}

#[tauri::command]
pub async fn api_comment_send(
    state: State<'_, Api>,
    id: i64,
    ep: u32,
    text: String,
    reply_id: Option<i64>,
) -> Result<Value, String> {
    let mut body = json!({ "text": text });
    let path = match reply_id {
        Some(rid) if rid > 0 => {
            body["reply_id"] = json!(rid);
            format!("/api/videos/{id}/comments")
        }
        _ => format!("/api/videos/{id}/comments?ep={ep}"),
    };
    state.authed("POST", &path, Some(body)).await
}

#[tauri::command]
pub async fn api_like(state: State<'_, Api>, id: i64, ep: u32, on: bool) -> Result<Value, String> {
    let method = if on { "POST" } else { "DELETE" };
    state
        .authed(method, &format!("/api/videos/{id}/like?ep={ep}"), None)
        .await
}

#[tauri::command]
pub async fn api_collect(state: State<'_, Api>, id: i64, on: bool) -> Result<Value, String> {
    let method = if on { "POST" } else { "DELETE" };
    state
        .authed(method, &format!("/api/videos/{id}/collect"), None)
        .await
}

#[tauri::command]
pub async fn api_follow(state: State<'_, Api>, uid: i64, on: bool) -> Result<Value, String> {
    let method = if on { "POST" } else { "DELETE" };
    state
        .authed(method, &format!("/api/users/{uid}/follow"), None)
        .await
}

/* ───────────────────────── 本地缓存 ───────────────────────── */

#[tauri::command]
pub async fn cache_clear() -> Result<(), String> {
    crate::media::clear_caches();
    Ok(())
}

/* ───────────────────────── 吃瓜帖子互动 ───────────────────────── */

#[tauri::command]
pub async fn api_post_like(state: State<'_, Api>, id: i64, on: bool) -> Result<Value, String> {
    let method = if on { "POST" } else { "DELETE" };
    state
        .authed(method, &format!("/api/posts/{id}/like"), None)
        .await
}

#[tauri::command]
pub async fn api_post_collect(state: State<'_, Api>, id: i64, on: bool) -> Result<Value, String> {
    let method = if on { "POST" } else { "DELETE" };
    state
        .authed(method, &format!("/api/posts/{id}/collect"), None)
        .await
}

#[tauri::command]
pub async fn api_post_comments(
    state: State<'_, Api>,
    id: i64,
    page: u32,
    size: u32,
) -> Result<Value, String> {
    state
        .get(&format!("/api/posts/{id}/comments?page={page}&size={size}"))
        .await
}
#[cfg(test)]
mod tests {
    use super::{is_newer, normalize_post_playback, normalize_video_playback};
    use serde_json::{json, Value};

    #[test]
    fn frontend_cannot_bypass_url_policy_with_opener_commands() {
        let capability: Value =
            serde_json::from_str(include_str!("../capabilities/default.json")).unwrap();
        for permission in capability["permissions"].as_array().unwrap() {
            let name = permission
                .as_str()
                .or_else(|| permission["identifier"].as_str())
                .unwrap();
            assert!(
                !name.starts_with("opener:"),
                "frontend opener command exposed: {name}"
            );
        }
    }

    #[test]
    fn external_links_are_urls_not_shell_commands() {
        for raw in [
            "https://example.com/|calc.exe",
            "https://example.com/?a=1&b=2",
            "https://example.com/%25PATH%25",
            "https://example.com/%VAR%",
        ] {
            assert!(crate::network_policy::parse_target(raw).is_ok());
        }
        for raw in [
            "file:///etc/passwd",
            "mailto:user@example.com",
            "tel:123",
            "data:text/html,test",
            "javascript:alert(1)",
            "https://example.com/\0cmd",
            "https://user:password@example.com/",
        ] {
            assert!(crate::network_policy::parse_target(raw).is_err());
        }
    }

    #[test]
    fn compares_versions() {
        assert!(is_newer("v1.0.2", "1.0.1"));
        assert!(is_newer("v1.1", "1.0.9"));
        assert!(is_newer("1.0.10", "1.0.9"));
        assert!(!is_newer("v1.0.1", "1.0.1"));
        assert!(!is_newer("v0.9.9", "1.0.1"));
        assert!(!is_newer("", "1.0.1"));
    }

    #[test]
    fn normalizes_video_playback_from_streams_and_legacy_fallback() {
        // 对齐上游 POST /api/videos/{id}/episodes/{ep}/playback 返回结构
        let raw = json!({
            "video_url": "",
            "video_url_hevc": "",
            "streams": {
                "main": "https://cdn.example/v/12/index.m3u8",
                "hevc": "https://cdn.example/v/12/hevc.m3u8",
                "preview": "https://cdn.example/v/12/preview.m3u8"
            },
            "cdn": {
                "m3u8Enabled": true,
                "otherEnabled": false,
                "authKey": "x-cdn-auth",
                "authValue": "token-123",
                "app": "150"
            }
        });
        let normalized = normalize_video_playback(raw);
        assert_eq!(
            normalized["video_url"],
            "https://cdn.example/v/12/index.m3u8"
        );
        assert_eq!(
            normalized["video_url_hevc"],
            "https://cdn.example/v/12/hevc.m3u8"
        );

        let preview_only = normalize_video_playback(json!({
            "streams": {
                "main": "  ",
                "preview": "https://cdn.example/v/12/preview.m3u8"
            }
        }));
        assert_eq!(
            preview_only["video_url"],
            "https://cdn.example/v/12/preview.m3u8"
        );

        let legacy = normalize_video_playback(json!({
            "video_url": "https://cdn.example/legacy.m3u8",
            "streams": {
                "main": "https://cdn.example/v/12/index.m3u8"
            }
        }));
        assert_eq!(legacy["video_url"], "https://cdn.example/legacy.m3u8");
    }

    #[test]
    fn normalizes_post_playback_from_videos_and_preserves_inline_url() {
        // 对齐上游 GET /api/posts/{id} (video_url="") + POST /api/posts/{id}/playback
        let post = json!({
            "id": 65,
            "title": "test",
            "video_url": ""
        });
        let playback = json!({
            "videos": [
                { "url": "https://cdn.example/post/65/index.m3u8" }
            ],
            "cdn": {
                "m3u8Enabled": true,
                "otherEnabled": true,
                "authKey": "x-cdn-auth",
                "authValue": "post-tok",
                "app": "150"
            }
        });
        let normalized = normalize_post_playback(post, Some(playback));
        assert_eq!(
            normalized["video_url"],
            "https://cdn.example/post/65/index.m3u8"
        );
        assert_eq!(
            normalized["videos"][0]["url"],
            "https://cdn.example/post/65/index.m3u8"
        );

        let inline = normalize_post_playback(
            json!({ "id": 65, "video_url": "https://cdn.example/inline.m3u8" }),
            Some(json!({ "videos": [{ "url": "https://cdn.example/other.m3u8" }] })),
        );
        assert_eq!(inline["video_url"], "https://cdn.example/inline.m3u8");
    }
}
