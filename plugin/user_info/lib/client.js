window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-user-info",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");

    //#region css
    const css = ".ui-section{max-width:640px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.ui-block{margin:0;font-size:15px;font-weight:600}.ui-intro{color:var(--dsw-alias-label-tertiary);margin:0 0 4px;font-size:13px;line-height:20px}.ui-divider{border:0;border-top:1px solid var(--dsw-alias-border-l2);margin:10px 0}.ui-form{flex-direction:column;gap:12px;display:flex}.ui-field{flex-direction:column;gap:6px;display:flex}.ui-label{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.ui-input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:100%;height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:13px;line-height:22px}.ui-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.ui-input::placeholder{color:var(--dsw-alias-label-dimmed)}.ui-textarea{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:100%;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:8px 10px;font-size:13px;line-height:20px;min-height:88px;resize:vertical}.ui-textarea:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.ui-textarea::placeholder{color:var(--dsw-alias-label-dimmed)}.ui-actions{align-items:center;gap:12px;display:flex}.ui-save{border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:8px;height:32px;padding:0 16px;font-size:13px;line-height:20px}.ui-save:hover{background:var(--dsw-alias-interactive-bg-hover)}.ui-save:disabled{opacity:.5;cursor:default}.ui-saved{color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px}.ui-error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}/* 用户卡片：左 1/3 头像+名字，右 2/3 三条属性条 */.ui-user-row{flex-direction:row;gap:24px;align-items:stretch;display:flex}.ui-user-left{flex:1;min-width:0;flex-direction:column;gap:10px;align-items:center;display:flex}.ui-user-right{flex:2;min-width:0;flex-direction:column;justify-content:space-between;display:flex}.ui-avatar{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);width:76px;height:76px;border-radius:50%;align-items:center;justify-content:center;display:flex;overflow:hidden}.ui-title-row{flex-direction:row;gap:6px;align-items:center;justify-content:center;display:flex}.ui-title-text{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px}.ui-title-help-wrap{display:inline-flex;position:relative}.ui-title-help{box-sizing:border-box;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary);cursor:help;text-align:center;font-size:11px;line-height:16px;display:inline-block;user-select:none;flex:none}.ui-title-tip{background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);box-shadow:var(--dsw-shadow-lv1);white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;border-radius:8px;padding:8px 12px;z-index:30;display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%)}.ui-title-help-wrap:hover .ui-title-tip{display:block}.ui-stats-help{box-sizing:border-box;width:18px;height:18px;border-radius:50%;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary);cursor:pointer;border:none;padding:0;text-align:center;font-size:11px;line-height:16px;display:inline-flex;align-items:center;justify-content:center;flex:none}.ui-stats-help:hover{color:var(--dsw-alias-label-primary)}.ui-stats-help-body{flex-direction:column;gap:4px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;display:flex}.ui-stats-tip-divider{border:0;border-top:1px solid var(--dsw-alias-border-l2);margin:3px 0}.ui-avatar img{width:100%;height:100%;object-fit:cover;display:block}.ui-top-row{flex-direction:row;gap:10px;align-items:center;display:flex}.ui-top-label{color:var(--dsw-alias-label-secondary);flex:none;font-size:12px;line-height:18px}.ui-top-row > .ui-top-label:first-child{width:52px}.ui-name-input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);flex:1;min-width:0;height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:13px;line-height:22px}.ui-level{flex:none;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:600;line-height:20px}.ui-name-text{color:var(--dsw-alias-label-primary);flex:1;min-width:0;font-size:13px;line-height:22px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.ui-gear{box-sizing:border-box;width:26px;height:26px;flex:none;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;justify-content:center;padding:0;display:inline-flex}.ui-gear:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.ui-modal-mask{background:var(--dsw-alias-bg-mask-1);z-index:1000;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.ui-modal{background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-shadow-lv3);width:min(360px,calc(100vw - 48px));border-radius:16px;flex-direction:column;gap:14px;padding:20px;display:flex}.ui-modal-title{margin:0;color:var(--dsw-alias-label-primary);font-size:16px;font-weight:600;line-height:24px}.ui-modal-field{flex-direction:column;gap:6px;display:flex}.ui-modal-actions{justify-content:flex-end;gap:8px;display:flex}.ui-save-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:none}.ui-save-primary:hover{background:var(--dsw-alias-button-primary-hover)}.ui-name-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.ui-user-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;min-height:18px}.ui-stat{flex-direction:row;gap:10px;align-items:center;display:flex}.ui-stat-label{color:var(--dsw-alias-label-secondary);flex:none;width:52px;font-size:12px;line-height:18px}.ui-bar{flex:1;min-width:0;background:var(--dsw-alias-bg-overlay);height:10px;border-radius:999px;overflow:hidden}.ui-bar-fill{height:100%;border-radius:999px;transition:width .2s ease}.ui-stat-value{color:var(--dsw-alias-label-secondary);flex:none;width:40px;text-align:right;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}/* 侧边栏底部迷你进度条（设置按钮上方）*/.ui-sb-stats{box-sizing:border-box;flex-direction:column;gap:7px;padding:8px 8px 2px 6px;width:100%;display:flex}.ui-sb-stat{flex-direction:row;gap:8px;align-items:center;display:flex}.ui-sb-stat-label{color:var(--dsw-alias-label-secondary);flex:none;width:40px;font-size:11px;line-height:16px}.ui-sb-bar{flex:1;min-width:0;background:var(--dsw-alias-bg-overlay);height:14px;border-radius:999px;overflow:hidden}.ui-sb-bar-fill{height:100%;border-radius:999px;transition:width .2s ease}.ui-sb-stat-value{color:var(--dsw-alias-label-secondary);flex:none;width:34px;text-align:right;font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}.ui-sb-stats-rail{width:auto;padding:8px 14px 2px}.ui-sb-stats-rail .ui-sb-stat-label,.ui-sb-stats-rail .ui-sb-stat-value{display:none}.ui-sb-stats-rail .ui-sb-bar{height:8px}";
    const cssTag = "data-plugin-css=\"@deepseek-ai/dsh-client-ui-user-info/css\"";
    if (typeof document !== "undefined" && document.querySelector("style[" + cssTag + "]") === null) {
      const tag = document.createElement("style");
      tag.setAttribute("data-plugin-css", "@deepseek-ai/dsh-client-ui-user-info/css");
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    //#endregion

    //#region Remote contract (userInfo namespace, mounted by this plugin)
    const passthroughSchema = { parse: (value) => value };
    const strictCodec = (typeSymbol) => ({ mode: "strict", typeSymbol, schema: passthroughSchema });

    const TYPERT_REMOTE = {
      package: "@deepseek-ai/dsh-client-ui-user-info",
      descriptors: [
        {
          id: "@deepseek-ai/dsh-client-ui-user-info#userInfo/get",
          service: "userInfo",
          namespace: "userInfo",
          method: "get",
          invocation: { kind: "direct" },
          parameters: [],
          result: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/get:result")
        },
        {
          id: "@deepseek-ai/dsh-client-ui-user-info#userInfo/save",
          service: "userInfo",
          namespace: "userInfo",
          method: "save",
          invocation: { kind: "direct" },
          parameters: [{
            name: "args",
            wire: "args",
            source: "json",
            codec: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/save:args")
          }],
          result: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/save:result")
        },
        {
          id: "@deepseek-ai/dsh-client-ui-user-info#userInfo/getStats",
          service: "userInfo",
          namespace: "userInfo",
          method: "getStats",
          invocation: { kind: "direct" },
          parameters: [],
          result: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/getStats:result")
        },
        {
          id: "@deepseek-ai/dsh-client-ui-user-info#userInfo/loadAvatar",
          service: "userInfo",
          namespace: "userInfo",
          method: "loadAvatar",
          invocation: { kind: "direct" },
          parameters: [{
            name: "args",
            wire: "args",
            source: "json",
            codec: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/loadAvatar:args")
          }],
          result: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/loadAvatar:result")
        },
        {
          id: "@deepseek-ai/dsh-client-ui-user-info#userInfo/getWeekStats",
          service: "userInfo",
          namespace: "userInfo",
          method: "getWeekStats",
          invocation: { kind: "direct" },
          parameters: [],
          result: strictCodec("@deepseek-ai/dsh-client-ui-user-info#userInfo/getWeekStats:result")
        }
      ]
    };

    function userInfoRemote(ctx) {
      const service = ctx.get("remote.userInfo");
      if (service === undefined) {
        throw new Error("userInfo Remote is unavailable");
      }
      return service;
    }

    async function infoGet(ctx) {
      const result = await userInfoRemote(ctx).get();
      if (!result.ok) {
        throw new Error(
          "userInfo.get failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }

    async function infoSave(ctx, kind, data) {
      const result = await userInfoRemote(ctx).save({ kind: kind, name: data.name, description: data.description, instructions: data.instructions, avatarPath: data.avatarPath });
      if (!result.ok) {
        throw new Error(
          "userInfo.save failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }

    async function infoLoadAvatar(ctx, path) {
      const result = await userInfoRemote(ctx).loadAvatar({ path: path });
      if (!result.ok) {
        throw new Error(
          "userInfo.loadAvatar failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }

    async function infoGetWeekStats(ctx) {
      const result = await userInfoRemote(ctx).getWeekStats();
      if (!result.ok) {
        throw new Error(
          "userInfo.getWeekStats failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }

    async function infoGetStats(ctx) {
      const result = await userInfoRemote(ctx).getStats();
      if (!result.ok) {
        throw new Error(
          "userInfo.getStats failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }
    //#endregion

    // 预填充头像：assets/avatar.png（由 DSHApp/Assets/AppIconSource.png 缩小生成）
    // 直接内联 base64，避免依赖 Host 端 Remote（Host 改动需重启才生效）。
    const AVATAR_DATA_URL = "data:image/png;base64,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";

    // 称号体系：按等级（每 100M Token 一级）转换当前称号，每 10 级提升一次
    function titleOf(level) {
      if (level >= 100) return "编程仙人";
      if (level >= 90) return "编程斗神";
      if (level >= 80) return "编程斗帝";
      if (level >= 70) return "编程斗圣";
      if (level >= 60) return "编程斗尊";
      if (level >= 50) return "编程斗宗";
      if (level >= 40) return "编程斗皇";
      if (level >= 30) return "编程斗王";
      if (level >= 20) return "编程斗灵";
      if (level >= 10) return "编程斗师";
      return "编程斗者";
    }

    // 百分比保护：无论计算值如何，限制在 0-100（扣成负数也显示 0%）
    function safePct(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, Math.round(n)));
    }

    // 用户卡片：左 1/3 圆框头像 + 居中名字输入框，右 2/3 三条属性进度条
    function UserCard({ ctx }) {
      const el = react.createElement;
      const [name, setName] = react.useState("");
      const [avatar, setAvatar] = react.useState("");
      const [xp, setXp] = react.useState({ level: 0, progress: 80 });
      const [saving, setSaving] = react.useState(false);
      const [error, setError] = react.useState(null);
      const [loaded, setLoaded] = react.useState(false);
      const [editOpen, setEditOpen] = react.useState(false);
      const [editName, setEditName] = react.useState("");
      const [avatarPath, setAvatarPath] = react.useState("");
      const [editAvatarPath, setEditAvatarPath] = react.useState("");
      const [helpOpen, setHelpOpen] = react.useState(false);
      const [hp, setHp] = react.useState(80);
      const [mp, setMp] = react.useState(80);
      const [costLimit, setCostLimit] = react.useState(100);
      const [tokenLimitM, setTokenLimitM] = react.useState(100);
      const [editCostLimit, setEditCostLimit] = react.useState("100");
      const [editTokenLimitM, setEditTokenLimitM] = react.useState("100");
      // 右边留白 = 左列头像框距离左边的距离（(左列宽 - 头像宽) / 2），随窗口自适应
      const leftRef = react.useRef(null);
      const [leftPad, setLeftPad] = react.useState(64);

      react.useEffect(() => {
        const el = leftRef.current;
        if (!el) return undefined;
        const update = () => {
          const w = el.getBoundingClientRect().width;
          setLeftPad(Math.max(0, Math.round((w - 76) / 2)));
        };
        update();
        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(update);
          ro.observe(el);
          return () => ro.disconnect();
        }
        return undefined;
      }, []);

      react.useEffect(() => {
        let alive = true;
        const load = async () => {
          try {
            // getWeekStats 可能因 Host 未重启而 404：失败时静默降级（week = null）
            const [res, stats, week] = await Promise.all([
              infoGet(ctx),
              infoGetStats(ctx),
              infoGetWeekStats(ctx).catch(() => null)
            ]);
            if (!alive) return;
            const doc = (res && res.user) ? res.user : (res || {});
            setName(doc.name || "");
            setAvatarPath(doc.avatarPath || "");
            setXp({
              level: (stats && typeof stats.level === "number") ? stats.level : 0,
              progress: (stats && typeof stats.progress === "number") ? stats.progress : 80
            });
            setCostLimit((doc && typeof doc.dailyCostLimit === "number") ? doc.dailyCostLimit : 100);
            setTokenLimitM((doc && typeof doc.dailyTokenLimitM === "number") ? doc.dailyTokenLimitM : 100);
            setHp((week && typeof week.hp === "number") ? safePct(week.hp) : 80);
            setMp((week && typeof week.mp === "number") ? safePct(week.mp) : 80);
            setError(null);
            if (doc.avatarPath) {
              try {
                const av = await infoLoadAvatar(ctx, doc.avatarPath);
                if (alive) setAvatar(av && av.data ? "data:" + (av.mime || "image/png") + ";base64," + av.data : AVATAR_DATA_URL);
              } catch (e) {
                if (alive) setAvatar(AVATAR_DATA_URL);
              }
            } else {
              setAvatar(AVATAR_DATA_URL);
            }
          } catch (e) {
            if (alive) setError(String((e && e.message) || e));
          } finally {
            if (alive) setLoaded(true);
          }
        };
        // 定时刷新：每分钟只更新 HP/MP/XP（不动昵称/头像，避免闪烁）
        const refreshStats = async () => {
          const [week, stats] = await Promise.all([
            infoGetWeekStats(ctx).catch(() => null),
            infoGetStats(ctx).catch(() => null)
          ]);
          if (!alive) return;
          if (week && typeof week.hp === "number") setHp(safePct(week.hp));
          if (week && typeof week.mp === "number") setMp(safePct(week.mp));
          setXp((prev) => ({
            level: (stats && typeof stats.level === "number") ? stats.level : prev.level,
            progress: (stats && typeof stats.progress === "number") ? safePct(stats.progress) : prev.progress
          }));
        };
        load();
        const timer = window.setInterval(refreshStats, 60000);
        return () => { alive = false; window.clearInterval(timer); };
      }, []);

      const openEdit = () => {
        setEditName(name);
        setEditAvatarPath(avatarPath);
        setEditCostLimit(String(costLimit));
        setEditTokenLimitM(String(tokenLimitM));
        setEditOpen(true);
      };
      const closeEdit = () => {
        setEditOpen(false);
        setError(null);
      };
      const saveEdit = async () => {
        setSaving(true);
        try {
          const toNumClient = (v, d) => {
            const n = Number(v);
            return Number.isFinite(n) && n >= 0 ? n : d;
          };
          const newCost = toNumClient(editCostLimit, 100);
          const newTokenM = toNumClient(editTokenLimitM, 100);
          const res = await infoGet(ctx);
          const doc = (res && res.user) ? res.user : (res || {});
          await infoSave(ctx, "user", {
            ...doc,
            name: editName,
            avatarPath: editAvatarPath,
            dailyCostLimit: newCost,
            dailyTokenLimitM: newTokenM
          });
          setName(editName);
          setAvatarPath(editAvatarPath);
          setCostLimit(newCost);
          setTokenLimitM(newTokenM);
          setEditOpen(false);
          setError(null);
          if (editAvatarPath) {
            try {
              const av = await infoLoadAvatar(ctx, editAvatarPath);
              setAvatar(av && av.data ? "data:" + (av.mime || "image/png") + ";base64," + av.data : AVATAR_DATA_URL);
            } catch (e) {
              setAvatar(AVATAR_DATA_URL);
            }
          } else {
            setAvatar(AVATAR_DATA_URL);
          }
          try {
            const week = await infoGetWeekStats(ctx);
            if (week && typeof week.hp === "number") setHp(safePct(week.hp));
            if (week && typeof week.mp === "number") setMp(safePct(week.mp));
          } catch (e) { /* 忽略刷新失败 */ }
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setSaving(false);
        }
      };

      return el("div", { className: "ui-user-row" },
        el("div", { className: "ui-user-left", ref: leftRef },
          el("div", { className: "ui-avatar" },
            avatar ? el("img", { src: avatar, alt: "头像" }) : null
          ),
          el("div", { className: "ui-title-row" },
            el("span", { className: "ui-title-text" }, titleOf(xp.level)),
            el("span", { className: "ui-title-help-wrap" },
              el("span", { className: "ui-title-help" }, "?"),
              el("div", { className: "ui-title-tip" }, "称号每10级提升一次，100级为最高称号")
            )
          )
        ),
        el("div", { className: "ui-user-right", style: { paddingRight: leftPad + "px" } },
          el("div", { className: "ui-top-row" },
            el("span", { className: "ui-top-label" }, "昵称"),
            el("span", { className: "ui-name-text", title: name }, name || "—"),
            el("span", { className: "ui-top-label" }, "等级"),
            el("span", { className: "ui-level" }, "Lv." + xp.level),
            el("button", {
              type: "button", className: "ui-stats-help", title: "属性说明",
              onClick: () => setHelpOpen(true)
            }, "?"),
            el("button", {
              type: "button", className: "ui-gear", title: "编辑",
              onClick: openEdit
            },
              el("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "currentColor", "aria-hidden": "true" },
                el("path", { d: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" })
              )
            )
          ),
          el("div", { key: "hp", className: "ui-stat" },
            el("span", { className: "ui-stat-label" }, "生命值"),
            el("div", { className: "ui-bar" },
              el("div", { className: "ui-bar-fill", style: { width: hp + "%", background: "var(--dsw-static-deepseek-500)" } })
            ),
            el("span", { className: "ui-stat-value" }, hp + "%")
          ),
          el("div", { key: "mp", className: "ui-stat" },
            el("span", { className: "ui-stat-label" }, "魔力值"),
            el("div", { className: "ui-bar" },
              el("div", { className: "ui-bar-fill", style: { width: mp + "%", background: "var(--dsw-static-deepseek-400)" } })
            ),
            el("span", { className: "ui-stat-value" }, mp + "%")
          ),
          el("div", { key: "xp", className: "ui-stat" },
            el("span", { className: "ui-stat-label" }, "经验值"),
            el("div", { className: "ui-bar" },
              el("div", { className: "ui-bar-fill", style: { width: xp.progress + "%", background: "var(--dsw-static-deepseek-300)" } })
            ),
            el("span", { className: "ui-stat-value" }, xp.progress + "%")
          )
        ),
        editOpen ? el("div", { className: "ui-modal-mask", onClick: closeEdit },
          el("div", { className: "ui-modal", onClick: (e) => e.stopPropagation() },
            el("h3", { className: "ui-modal-title" }, "编辑用户信息"),
            el("div", { className: "ui-modal-field" },
              el("label", { className: "ui-label", htmlFor: "ui-edit-name" }, "昵称"),
              el("input", {
                id: "ui-edit-name", type: "text", className: "ui-input",
                value: editName, onChange: (e) => setEditName(e.target.value),
                autoFocus: true, placeholder: ""
              })
            ),
            el("div", { className: "ui-modal-field" },
              el("label", { className: "ui-label", htmlFor: "ui-edit-avatar" }, "头像（图片文件路径）"),
              el("input", {
                id: "ui-edit-avatar", type: "text", className: "ui-input",
                value: editAvatarPath, onChange: (e) => setEditAvatarPath(e.target.value),
                placeholder: "例如：/Users/me/Pictures/avatar.png"
              })
            ),
            el("div", { className: "ui-modal-field" },
              el("label", { className: "ui-label", htmlFor: "ui-edit-cost" }, "每日费用限额（元）"),
              el("input", {
                id: "ui-edit-cost", type: "number", min: "0", step: "any", className: "ui-input",
                value: editCostLimit, onChange: (e) => setEditCostLimit(e.target.value),
                placeholder: "100"
              })
            ),
            el("div", { className: "ui-modal-field" },
              el("label", { className: "ui-label", htmlFor: "ui-edit-token" }, "每日Tokens限额（M）"),
              el("input", {
                id: "ui-edit-token", type: "number", min: "0", step: "any", className: "ui-input",
                value: editTokenLimitM, onChange: (e) => setEditTokenLimitM(e.target.value),
                placeholder: "100"
              })
            ),
            error ? el("p", { className: "ui-error" }, error) : null,
            el("div", { className: "ui-modal-actions" },
              el("button", { type: "button", className: "ui-save", onClick: closeEdit, disabled: saving }, "取消"),
              el("button", { type: "button", className: "ui-save ui-save-primary", disabled: saving, onClick: saveEdit }, saving ? "保存中…" : "保存")
            )
          )
        ) : null,
        helpOpen ? el("div", { className: "ui-modal-mask", onClick: () => setHelpOpen(false) },
          el("div", { className: "ui-modal", onClick: (e) => e.stopPropagation() },
            el("h3", { className: "ui-modal-title" }, "角色属性说明"),
            el("div", { className: "ui-stats-help-body" },
              el("div", null, "生命值：本周剩余可用费用"),
              el("div", null, "魔力值：本周剩余可用Token"),
              el("div", null, "经验值：使用Token可提升"),
              el("hr", { className: "ui-stats-tip-divider" }),
              el("div", null, "生命和魔力限额可在设置中自定义，每周一更新")
            ),
            el("div", { className: "ui-modal-actions" },
              el("button", { type: "button", className: "ui-save ui-save-primary", onClick: () => setHelpOpen(false) }, "知道了")
            )
          )
        ) : null
      );
    }

    // 助手表单：名称 / 描述 / 指令 + 保存
    function AssistantForm({ ctx }) {
      const el = react.createElement;
      const [draft, setDraft] = react.useState({ name: "", description: "", instructions: "" });
      const [saving, setSaving] = react.useState(false);
      const [saved, setSaved] = react.useState(false);
      const [error, setError] = react.useState(null);
      const [loaded, setLoaded] = react.useState(false);

      react.useEffect(() => {
        let alive = true;
        const load = async () => {
          try {
            const res = await infoGet(ctx);
            const doc = (res && res.assistant) ? res.assistant : (res || {});
            if (!alive) return;
            setDraft({
              name: doc.name || "",
              description: doc.description || "",
              instructions: doc.instructions || "",
            });
            setError(null);
          } catch (e) {
            if (alive) setError(String((e && e.message) || e));
          } finally {
            if (alive) setLoaded(true);
          }
        };
        load();
      }, []);

      const onChange = (key) => (event) => {
        setDraft((prev) => ({ ...prev, [key]: event.target.value }));
        setSaved(false);
      };

      const save = async () => {
        setSaving(true);
        setSaved(false);
        try {
          const res = await infoSave(ctx, "assistant", draft);
          setDraft({
            name: res.name || "",
            description: res.description || "",
            instructions: res.instructions || "",
          });
          setSaved(true);
          setError(null);
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setSaving(false);
        }
      };

      return el("div", { className: "ui-form" },
        el("div", { className: "ui-field" },
          el("label", { className: "ui-label", htmlFor: "ai-name" }, "名称"),
          el("input", {
            id: "ai-name", type: "text", className: "ui-input",
            value: draft.name, onChange: onChange("name"), placeholder: ""
          })
        ),
        el("div", { className: "ui-field" },
          el("label", { className: "ui-label", htmlFor: "ai-desc" }, "描述"),
          el("input", {
            id: "ai-desc", type: "text", className: "ui-input",
            value: draft.description, onChange: onChange("description"), placeholder: ""
          })
        ),
        el("div", { className: "ui-field" },
          el("label", { className: "ui-label", htmlFor: "ai-instr" }, "指令"),
          el("textarea", {
            id: "ai-instr", className: "ui-textarea",
            value: draft.instructions, onChange: onChange("instructions"), placeholder: ""
          })
        ),
        el("div", { className: "ui-actions" },
          el("button", { type: "button", className: "ui-save", disabled: saving, onClick: save }, saving ? "保存中…" : "保存"),
          saved ? el("span", { className: "ui-saved" }, "已保存") : null,
          error ? el("p", { className: "ui-error" }, error) : null
        ),
        !loaded ? el("p", { className: "ui-intro" }, "加载中…") : null
      );
    }

    // 角色栏目内容：先"用户"，后"助手"
    function RoleSection({ ctx }) {
      const el = react.createElement;
      return el("div", { className: "ui-section" },
        el("h3", { className: "ui-block" }, "用户"),
        el(UserCard, { ctx }),
        el("hr", { className: "ui-divider" }),
        el("h3", { className: "ui-block" }, "助手"),
        el(AssistantForm, { ctx })
      );
    }

    // 侧边栏底部迷你进度条（渲染在"设置"按钮上方）：与设置页共用 hp/mp/xp 数据
    function SidebarStats({ ctx, wide }) {
      const el = react.createElement;
      const [hp, setHp] = react.useState(80);
      const [mp, setMp] = react.useState(80);
      const [xp, setXp] = react.useState(80);

      react.useEffect(() => {
        let alive = true;
        const load = async () => {
          const [week, stats] = await Promise.all([
            infoGetWeekStats(ctx).catch(() => null),
            infoGetStats(ctx).catch(() => null)
          ]);
          if (!alive) return;
          if (week && typeof week.hp === "number") setHp(safePct(week.hp));
          if (week && typeof week.mp === "number") setMp(safePct(week.mp));
          if (stats && typeof stats.progress === "number") setXp(safePct(stats.progress));
        };
        load();
        const timer = window.setInterval(load, 60000);
        return () => { alive = false; window.clearInterval(timer); };
      }, []);

      const rows = [
        { label: "生命值", value: hp, color: "var(--dsw-static-deepseek-500)" },
        { label: "魔力值", value: mp, color: "var(--dsw-static-deepseek-400)" },
        { label: "经验值", value: xp, color: "var(--dsw-static-deepseek-300)" }
      ];

      return el("div", { className: wide ? "ui-sb-stats" : "ui-sb-stats ui-sb-stats-rail" },
        rows.map((r) =>
          el("div", { key: r.label, className: "ui-sb-stat", title: r.label + " " + r.value + "%" },
            el("span", { className: "ui-sb-stat-label" }, r.label),
            el("div", { className: "ui-sb-bar" },
              el("div", { className: "ui-sb-bar-fill", style: { width: r.value + "%", background: r.color } })
            ),
            el("span", { className: "ui-sb-stat-value" }, r.value + "%")
          )
        )
      );
    }

    // 用户图标 SVG path（与 assets/user_icon.svg 一致，viewBox 0 0 1024 1024）。
    // 用 currentColor 填充，跟随导航文字颜色自动适配深色/浅色模式。
    const USER_SVG_PATHS = '<path d="M256.003008 341.329323c0-141.182341 114.806118-255.996992 255.988459-255.996992 141.182341 0 255.996992 114.814651 255.996992 255.996992 0 141.173808-114.814651 255.996992-255.996992 255.996992s-255.996992-114.823184-255.996992-255.996992m723.874161 629.018742c-41.949374-157.139487-152.540074-280.018043-291.409909-337.404035 98.592975-59.903296 164.862063-168.019359 164.862062-291.623241C853.312256 153.128867 700.183389 0 511.982934 0s-341.329323 153.128867-341.329323 341.329323c0 123.595348 66.260555 231.711411 164.904729 291.614707-138.878368 57.428659-249.469069 180.264549-291.444042 337.404035a42.649099 42.649099 0 0 0 30.207645 52.172187 42.708832 42.708832 0 0 0 52.257519-30.207645C175.278623 810.008616 333.740761 682.658645 512 682.658645s336.75551 127.358504 385.446138 309.671028a42.580833 42.580833 0 0 0 52.223386 30.207646 42.649099 42.649099 0 0 0 30.207645-52.180721" fill="currentColor"/>';

    // 把设置面板导航中"角色"行的默认齿轮图标替换为用户图标。
    // 用文本内容匹配导航按钮（不依赖位置序号），原 SVG 整体替换为带 currentColor
    // 的新 SVG，自动适配深色/浅色模式。
    function patchRoleIcon() {
      if (typeof document === "undefined") return;
      const navCells = document.querySelectorAll('[role="dialog"] nav button');
      for (const cell of navCells) {
        const label = cell.querySelector("span");
        if (!label || label.textContent !== "角色") continue;
        const oldSvg = cell.querySelector("svg");
        if (!oldSvg) continue;
        if (oldSvg.getAttribute("data-role-icon") === "true") continue; // 已替换
        const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute("viewBox", "0 0 1024 1024");
        newSvg.setAttribute("width", "16");
        newSvg.setAttribute("height", "16");
        newSvg.setAttribute("fill", "none");
        newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        newSvg.setAttribute("data-role-icon", "true");
        newSvg.style.flex = "none";
        newSvg.innerHTML = USER_SVG_PATHS;
        oldSvg.replaceWith(newSvg);
      }
    }

    const inject = ["slots", "remote"];

    async function apply(ctx) {
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
      // 唯一的"角色"栏目：通用设置下方（order 0 < 5 < models 10）
      slots.inject("settings.section", () => slots.register(
        { name: "settings.section", id: "role", order: 5, label: () => "角色" },
        (props) => react.createElement(RoleSection, { ctx })
      ));
      // 侧边栏底部（"设置"按钮上方）显示三条迷你进度条
      slots.inject("sidebar.footer.action", () => slots.register(
        { name: "sidebar.footer.action", id: "user-stats", order: 0 },
        (props) => react.createElement(SidebarStats, { ctx, wide: props.wide })
      ));
      // 监听设置面板 DOM 变化，在面板打开时替换"角色"导航图标。
      let observer = null;
      if (typeof document !== "undefined") {
        patchRoleIcon();
        observer = new MutationObserver(() => patchRoleIcon());
        observer.observe(document.body, { childList: true, subtree: true });
      }
      return async () => {
        if (observer) observer.disconnect();
        await disposeRemote();
      };
    }

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
