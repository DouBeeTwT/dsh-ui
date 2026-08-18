window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-proxy",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");

    //#region css
    const css = `.pxy-section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:10px;display:flex}
.pxy-heading{margin:0;font-size:18px;font-weight:600}
.pxy-intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:1.6}
.pxy-intro code{background:var(--dsw-alias-bg-layer-2);border-radius:4px;padding:1px 5px;font-size:12px}
.pxy-list{flex-direction:column;gap:10px;display:flex}
.pxy-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:12px;padding:12px 14px;flex-direction:column;gap:10px;display:flex}
.pxy-card-head{flex-direction:row;align-items:center;gap:10px;display:flex}
.pxy-card-name{font-size:14px;font-weight:600;flex:1;min-width:0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.pxy-badge{font-size:11px;border-radius:6px;padding:2px 7px;flex:none;line-height:16px}
.pxy-badge[data-on=true]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 16%,transparent);color:var(--dsw-alias-state-success-primary)}
.pxy-badge[data-on=false]{background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.16));color:var(--dsw-alias-label-tertiary)}
.pxy-badge[data-err=true]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 16%,transparent);color:var(--dsw-alias-state-error-primary)}
.pxy-rows{flex-direction:column;gap:8px;display:flex}
.pxy-row{flex-direction:row;gap:10px;align-items:center;display:flex}
.pxy-label{color:var(--dsw-alias-label-secondary);font-size:12px;width:96px;flex:none}
.pxy-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1,transparent);height:32px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:13px;flex:1;min-width:0}
.pxy-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.pxy-input-port{flex:none;width:110px}
.pxy-select{cursor:pointer;height:34px}
.pxy-hint{color:var(--dsw-alias-label-tertiary);font-size:11px;margin:0;padding-left:106px}
.pxy-actions{flex-direction:row;gap:8px;align-items:center;display:flex;flex-wrap:wrap}
.pxy-btn{border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:8px;height:32px;padding:0 14px;font-size:13px}
.pxy-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.pxy-btn:disabled{opacity:.5;cursor:default}
.pxy-btn-danger{color:var(--dsw-alias-state-error-primary)}
.pxy-btn-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.pxy-spacer{flex:1}
.pxy-msg{font-size:12px;margin:0}
.pxy-msg[data-kind=ok]{color:var(--dsw-alias-state-success-primary)}
.pxy-msg[data-kind=err]{color:var(--dsw-alias-state-error-primary)}
.pxy-empty{color:var(--dsw-alias-label-tertiary);border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;padding:18px;font-size:13px;text-align:center}
.pxy-switch{position:relative;width:38px;height:22px;flex:none;cursor:pointer;background:0 0;border:0;padding:0}
.pxy-switch-track{position:absolute;inset:0;border-radius:11px;background:var(--dsw-alias-border-l2);transition:background .15s}
.pxy-switch[data-on=true] .pxy-switch-track{background:var(--dsw-alias-brand-primary)}
.pxy-switch-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
.pxy-switch[data-on=true] .pxy-switch-knob{transform:translateX(16px)}
.pxy-switch:disabled{opacity:.5;cursor:default}
.pxy-divider{border:0;border-top:1px solid var(--dsw-alias-border-l1);margin:2px 0}
.pxy-headline{flex-direction:row;align-items:center;gap:8px;display:flex}
.pxy-help{position:relative;flex:none}
.pxy-help-btn{width:20px;height:20px;border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-secondary);border-radius:50%;font:inherit;font-size:12px;line-height:1;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center}
.pxy-help-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-tertiary)}
.pxy-help-pop{position:absolute;top:26px;left:0;z-index:50;width:320px;max-width:70vw;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:var(--dsw-shadow-lv3);padding:12px 14px;font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.8}
.pxy-help-pop p{margin:0 0 4px}
.pxy-help-pop p:last-child{margin-bottom:0}
.pxy-help-pop code{background:var(--dsw-alias-bg-layer-2);border-radius:4px;padding:1px 5px;color:var(--dsw-alias-label-primary)}`;
    const cssTag = "data-plugin-css=\"@deepseek-ai/dsh-client-ui-proxy/css\"";
    if (typeof document !== "undefined" && document.querySelector("style[" + cssTag + "]") === null) {
      const tag = document.createElement("style");
      tag.setAttribute("data-plugin-css", "@deepseek-ai/dsh-client-ui-proxy/css");
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    //#endregion

    //#region Remote contract (proxyBridge namespace, mounted by this plugin)
    const passthroughSchema = { parse: (value) => value };
    const strictCodec = (typeSymbol) => ({ mode: "strict", typeSymbol, schema: passthroughSchema });
    const PKG = "@deepseek-ai/dsh-client-ui-proxy";

    const argsParam = (method) => [{
      name: "args",
      wire: "args",
      source: "json",
      codec: strictCodec(PKG + "#proxyBridge/" + method + ":args")
    }];

    const descriptor = (method, withArgs) => ({
      id: PKG + "#proxyBridge/" + method,
      service: "proxyBridge",
      namespace: "proxyBridge",
      method,
      invocation: { kind: "direct" },
      parameters: withArgs ? argsParam(method) : [],
      result: strictCodec(PKG + "#proxyBridge/" + method + ":result")
    });

    const TYPERT_REMOTE = {
      package: PKG,
      descriptors: [
        descriptor("list", false),
        descriptor("providers", false),
        descriptor("save", true),
        descriptor("deleteRule", true),
        descriptor("toggle", true),
        descriptor("test", true)
      ]
    };

    function proxyRemote(ctx) {
      const service = ctx.get("remote.proxyBridge");
      if (service === undefined) {
        throw new Error("proxyBridge Remote is unavailable");
      }
      return service;
    }

    async function callRemote(ctx, method, request) {
      const service = proxyRemote(ctx);
      const result = request === undefined
        ? await service[method]()
        : await service[method](request);
      if (!result.ok) {
        throw new Error(
          "proxyBridge." + method + " failed: " +
          result.error.code + ": " + result.error.message
        );
      }
      return result.value;
    }
    //#endregion

    const el = react.createElement;
    const DEFAULT_UA_FALLBACK = "claude-cli/2.1.233 (external, sdk-cli)";

    /** 受控开关。 */
    function Switch(props) {
      return el("button", {
        type: "button",
        className: "pxy-switch",
        "data-on": props.on ? "true" : "false",
        role: "switch",
        "aria-checked": props.on ? "true" : "false",
        "aria-label": props.label,
        disabled: props.disabled === true,
        onClick: props.onToggle
      },
        el("span", { className: "pxy-switch-track" }),
        el("span", { className: "pxy-switch-knob" })
      );
    }

    /** 一行带标签的输入框。 */
    function Field(props) {
      const id = "pxy-f-" + props.rid + "-" + props.name;
      return el("div", { className: "pxy-row" },
        el("label", { className: "pxy-label", htmlFor: id }, props.label),
        el("input", {
          id,
          className: "pxy-input" + (props.narrow ? " pxy-input-port" : ""),
          type: props.type || "text",
          value: props.value,
          placeholder: props.placeholder || "",
          spellCheck: false,
          onChange: (e) => props.onChange(e.target.value)
        })
      );
    }

    /**
     * 单条代理规则卡片：可编辑上游 / UA / 端口，可开关、测试、保存、删除。
     * 本地保留一份草稿状态，避免每次输入都打后端。
     */
    function RuleCard(props) {
      const rule = props.rule;
      const [draft, setDraft] = react.useState({
        name: rule.name,
        upstream: rule.upstream,
        userAgent: rule.userAgent,
        listenPort: String(rule.listenPort)
      });
      const [testProvider, setTestProvider] = react.useState("");
      const [busy, setBusy] = react.useState(false);
      const [msg, setMsg] = react.useState(null);

      // 外部规则变化（保存后回传 / 其他操作刷新）时同步草稿。
      react.useEffect(() => {
        setDraft({
          name: rule.name,
          upstream: rule.upstream,
          userAgent: rule.userAgent,
          listenPort: String(rule.listenPort)
        });
      }, [rule.id, rule.name, rule.upstream, rule.userAgent, rule.listenPort]);

      const dirty =
        draft.name !== rule.name ||
        draft.upstream !== rule.upstream ||
        draft.userAgent !== rule.userAgent ||
        draft.listenPort !== String(rule.listenPort);

      const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));

      const run = async (fn) => {
        setBusy(true);
        setMsg(null);
        try {
          const out = await fn();
          if (out && out.message) setMsg({ kind: out.ok ? "ok" : "err", text: out.message });
          else if (out && out.ok === false) setMsg({ kind: "err", text: "操作失败" });
        } catch (e) {
          setMsg({ kind: "err", text: String((e && e.message) || e) });
        } finally {
          setBusy(false);
        }
      };

      const onSave = () => run(async () => {
        const out = await props.onSave({
          ...rule,
          name: draft.name,
          upstream: draft.upstream.trim(),
          userAgent: draft.userAgent,
          listenPort: Number(draft.listenPort)
        });
        if (out.ok) setMsg({ kind: "ok", text: "已保存" });
        return out;
      });

      const statusBadge = rule.error
        ? el("span", { className: "pxy-badge", "data-err": "true" }, "启动失败")
        : el("span", { className: "pxy-badge", "data-on": rule.running ? "true" : "false" },
            rule.running ? "运行中" : "已停止");

      const baseHint = (() => {
        let prefix = "";
        try { prefix = new URL(rule.upstream).pathname.replace(/\/+$/, ""); } catch { prefix = ""; }
        return "http://127.0.0.1:" + rule.listenPort + prefix;
      })();

      return el("div", { className: "pxy-card" },
        el("div", { className: "pxy-card-head" },
          el("span", { className: "pxy-card-name" }, rule.name || "未命名代理"),
          statusBadge,
          el(Switch, {
            on: rule.enabled,
            disabled: busy,
            label: "启用 " + (rule.name || "代理"),
            onToggle: () => run(() => props.onToggle(rule.id, !rule.enabled))
          })
        ),
        el("div", { className: "pxy-rows" },
          el(Field, { rid: rule.id, name: "name", label: "名称", value: draft.name, onChange: set("name"), placeholder: "例如 我的代理" }),
          el(Field, { rid: rule.id, name: "upstream", label: "上游地址", value: draft.upstream, onChange: set("upstream"), placeholder: "http://your_llm_url/v1" }),
          el(Field, { rid: rule.id, name: "ua", label: "User-Agent", value: draft.userAgent, onChange: set("userAgent"), placeholder: DEFAULT_UA_FALLBACK }),
          el(Field, { rid: rule.id, name: "port", label: "本地端口", value: draft.listenPort, onChange: set("listenPort"), narrow: true, placeholder: "8233" }),
          rule.enabled && rule.running
            ? el("p", { className: "pxy-hint" }, "把 provider 的 baseURL 填成：", el("code", null, baseHint))
            : null
        ),
        rule.running && props.providers && props.providers.length > 0
          ? el("div", { className: "pxy-row" },
              el("label", { className: "pxy-label", htmlFor: "pxy-test-" + rule.id }, "测试用 Provider"),
              el("select", {
                id: "pxy-test-" + rule.id,
                className: "pxy-input pxy-select",
                value: testProvider,
                onChange: (e) => setTestProvider(e.target.value)
              },
                el("option", { value: "" }, "— 选择要测试的 Provider —"),
                ...props.providers.map((p) =>
                  el("option", { key: p.provider, value: p.provider },
                    p.displayName + "（" + (p.models && p.models.length ? p.models.join(" / ") : "无模型") + "）"))
              )
            )
          : null,
        rule.error ? el("p", { className: "pxy-msg", "data-kind": "err" }, rule.error) : null,
        msg ? el("p", { className: "pxy-msg", "data-kind": msg.kind }, msg.text) : null,
        el("div", { className: "pxy-actions" },
          el("button", {
            type: "button",
            className: "pxy-btn pxy-btn-primary",
            disabled: busy || !dirty,
            onClick: onSave
          }, dirty ? "保存" : "已保存"),
          el("button", {
            type: "button",
            className: "pxy-btn",
            disabled: busy || !rule.running || !testProvider,
            onClick: () => run(() => props.onTest(rule.id, testProvider))
          }, "测试连通"),
          el("span", { className: "pxy-spacer" }),
          el("button", {
            type: "button",
            className: "pxy-btn pxy-btn-danger",
            disabled: busy,
            onClick: () => run(() => props.onRemove(rule.id))
          }, "删除")
        )
      );
    }

    /**
     * 代理设置分类主页面：列出全部 UA 改写代理规则，支持新增 / 编辑 / 开关 /
     * 测试 / 删除。
     */
    function ProxySection(props) {
      const ctx = props.ctx;
      const [rules, setRules] = react.useState([]);
      const [providers, setProviders] = react.useState([]);
      const [defaultUA, setDefaultUA] = react.useState(DEFAULT_UA_FALLBACK);
      const [loaded, setLoaded] = react.useState(false);
      const [topMsg, setTopMsg] = react.useState(null);
      const [helpOpen, setHelpOpen] = react.useState(false);

      const refresh = react.useCallback(async () => {
        try {
          const [listOut, provOut] = await Promise.all([
            callRemote(ctx, "list"),
            callRemote(ctx, "providers")
          ]);
          setRules(Array.isArray(listOut.rules) ? listOut.rules : []);
          if (listOut.defaultUserAgent) setDefaultUA(listOut.defaultUserAgent);
          setProviders(Array.isArray(provOut.providers) ? provOut.providers : []);
          setTopMsg(null);
        } catch (e) {
          setTopMsg({ kind: "err", text: String((e && e.message) || e) });
        } finally {
          setLoaded(true);
        }
      }, [ctx]);

      react.useEffect(() => { void refresh(); }, [refresh]);

      const applyResult = (out) => {
        if (out && Array.isArray(out.rules)) setRules(out.rules);
        return out;
      };

      const onSave = async (rule) => applyResult(await callRemote(ctx, "save", { rule }));
      const onRemove = async (id) => applyResult(await callRemote(ctx, "deleteRule", { id }));
      const onToggle = async (id, enabled) => applyResult(await callRemote(ctx, "toggle", { id, enabled }));
      const onTest = async (id, provider) => await callRemote(ctx, "test", { id, provider });

      const onAdd = async () => {
        // 端口取现有最大值 +1，避免默认撞车。
        let port = 8233;
        for (const r of rules) if (r.listenPort >= port) port = r.listenPort + 1;
        try {
          const out = await callRemote(ctx, "save", {
            rule: {
              name: "新代理",
              upstream: "http://your_llm_url/v1",
              userAgent: defaultUA,
              listenPort: port,
              enabled: false
            }
          });
          applyResult(out);
          if (!out.ok && out.message) setTopMsg({ kind: "err", text: out.message });
        } catch (e) {
          setTopMsg({ kind: "err", text: String((e && e.message) || e) });
        }
      };

      return el("section", { className: "pxy-section" },
        el("div", { className: "pxy-headline" },
          el("h2", { className: "pxy-heading" }, "代理"),
          el("div", { className: "pxy-help" },
            el("button", {
              type: "button",
              className: "pxy-help-btn",
              "aria-label": "怎么用",
              onClick: () => setHelpOpen((v) => !v)
            }, "?"),
            helpOpen ? el("div", { className: "pxy-help-pop" },
              el("p", null, "① 填上游地址（如 ", el("code", null, "http://your_llm_url/v1"), "）与目标客户端的 User-Agent"),
              el("p", null, "② 打开开关，确认状态为「运行中」"),
              el("p", null, "③ 点「测试连通」验证上游是否放行"),
              el("p", null, "④ 把 ", el("code", null, "~/.dsh/settings.yaml"), " 里对应 provider 的 ", el("code", null, "baseURL"), " 改成卡片提示的本地地址")
            ) : null
          )
        ),
        el("p", { className: "pxy-intro" },
          "为按 ", el("code", null, "User-Agent"),
          " 做客户端白名单的上游网关提供本地改写代理。DSH 的归因机制会强制发送自己的 ",
          el("code", null, "user-agent"),
          "，无法通过 provider 配置覆盖；启用规则后把对应 provider 的 ",
          el("code", null, "baseURL"),
          " 指向本地端口即可放行。代理只监听回环地址，随 DSH 启停。"
        ),
        topMsg ? el("p", { className: "pxy-msg", "data-kind": topMsg.kind }, topMsg.text) : null,
        !loaded
          ? el("p", { className: "pxy-intro" }, "加载中…")
          : rules.length === 0
            ? el("div", { className: "pxy-empty" }, "还没有代理规则。点击下方「新增代理」开始。")
            : el("div", { className: "pxy-list" },
                ...rules.map((r) => el(RuleCard, {
                  key: r.id,
                  rule: r,
                  providers,
                  onSave,
                  onRemove,
                  onToggle,
                  onTest
                }))
              ),
        el("div", { className: "pxy-actions" },
          el("button", { type: "button", className: "pxy-btn", onClick: onAdd }, "新增代理"),
          el("button", { type: "button", className: "pxy-btn", onClick: () => void refresh() }, "刷新状态")
        )
      );
    }

    const inject = ["slots", "remote"];

    // 代理图标 SVG path（与 assets/proxy_icon.svg 一致，viewBox 0 0 1024 1024）。
    const PROXY_SVG_PATHS = '<path d="M753.564731 337.471035c-45.8697 0-160.259984 113.849978-243.789399 194.548928C383.134027 654.383848 263.508509 773.284865 167.764911 773.284865l-58.892295 0c-24.068162 0-43.581588-19.526729-43.581588-43.581588s19.513426-43.581588 43.581588-43.581588l58.892295 0c60.504002 0 183.002964-121.68134 281.432741-216.784348 119.79641-115.744117 223.254713-219.029482 304.368102-219.029482l56.209186 0-59.641355-57.828057c-17.033955-16.993023-17.060561-42.902112-0.057305-59.927881 17.002232-17.030885 44.596707-17.064654 61.631686-0.065492l134.207631 133.874033c8.192589 8.172123 12.794397 19.238157 12.794397 30.803563 0 11.564383-4.601808 22.604834-12.794397 30.776957L811.706943 461.72599c-8.505721 8.486278-19.646456 12.522198-30.78719 12.522198-11.166317 0-22.333658-4.676509-30.844495-13.199627-17.003256-17.025769-16.975627-45.432749 0.057305-62.425771l59.641355-61.151755L753.564731 337.471035zM811.706943 561.66105c-17.034978-16.999163-44.629453-16.972557-61.631686 0.058328-17.003256 17.024745-16.975627 46.257533 0.057305 63.250556l59.641355 61.150732-56.209186 0c-35.793204 0-95.590102-52.946886-154.87637-108.373243-17.576307-16.435321-45.161572-16.3422-61.594847 1.226944-16.444531 17.568121-15.523555 46.393633 2.053776 62.823837 90.322122 84.458577 151.246703 131.484613 214.417441 131.484613l56.209186 0-59.641355 57.824987c-17.033955 16.993023-17.060561 43.736107-0.057305 60.761875 8.511861 8.523117 19.678178 12.369725 30.844495 12.369725 11.140735 0 22.281469-4.453429 30.78719-12.939707L945.914574 757.311055c8.192589-8.173147 12.794397-19.315928 12.794397-30.881334 0-11.564383-4.601808-22.682605-12.794397-30.855752L811.706943 561.66105zM108.871593 337.471035l58.892295 0c45.932122 0 114.40154 58.455343 168.915108 107.942431 8.352225 7.576559 18.832927 12.140505 29.29214 12.140505 11.852956 0 23.673166-4.394077 32.270984-13.857613 16.182564-17.807574 14.859429-46.823422-2.958378-62.998823-85.247546-77.381391-156.561755-130.388652-227.519854-130.388652l-58.892295 0c-24.068162 0-43.581588 19.526729-43.581588 43.581588S84.804455 337.471035 108.871593 337.471035z" fill="currentColor"/>';

    // 把设置面板导航中"代理"行的齿轮图标替换为代理图标。
    // 用文本内容匹配导航按钮（不依赖位置序号），原 SVG 整体替换为带 currentColor
    // 的 SVG，颜色跟随导航文字自动适配深色/浅色模式。
    function patchProxyIcon() {
      if (typeof document === "undefined") return;
      const navCells = document.querySelectorAll('[role="dialog"] nav button');
      for (const cell of navCells) {
        const label = cell.querySelector("span");
        if (!label || label.textContent !== "代理") continue;
        const oldSvg = cell.querySelector("svg");
        if (!oldSvg) continue;
        if (oldSvg.getAttribute("data-proxy-icon") === "true") continue; // 已替换
        const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute("viewBox", "0 0 1024 1024");
        newSvg.setAttribute("width", "16");
        newSvg.setAttribute("height", "16");
        newSvg.setAttribute("fill", "none");
        newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        newSvg.setAttribute("data-proxy-icon", "true");
        newSvg.style.flex = "none";
        newSvg.innerHTML = PROXY_SVG_PATHS;
        oldSvg.replaceWith(newSvg);
      }
    }

    async function apply(ctx) {
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
      slots.inject("settings.section", () => slots.register(
        { name: "settings.section", id: "proxy", order: 30, label: () => "代理" },
        (props) => react.createElement(ProxySection, { ctx })
      ));
      // 监听设置面板 DOM 变化，在面板打开时替换导航图标。
      let observer = null;
      if (typeof document !== "undefined") {
        patchProxyIcon();
        observer = new MutationObserver(() => patchProxyIcon());
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
