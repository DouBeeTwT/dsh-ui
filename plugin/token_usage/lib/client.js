window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-token-usage",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");

    //#region css
    const css = `.usage-section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}
.usage-heading{margin:0;font-size:18px;font-weight:600}
.usage-intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px}
.usage-toolbar{flex-direction:row;align-items:center;gap:14px;display:flex;flex-wrap:wrap}
.usage-tabs{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:flex-end;gap:22px;margin-top:2px;display:flex;flex:1}
.usage-tab{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;padding:7px 1px 9px;font-size:13px;line-height:20px;position:relative}
.usage-tab:hover,.usage-tab[data-active=true]{color:var(--dsw-alias-label-primary)}
.usage-tab[data-active=true]:after{background:var(--dsw-alias-label-primary);content:'';border-radius:2px 2px 0 0;height:2px;position:absolute;bottom:-1px;left:0;right:0}
.usage-select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);height:32px;border-radius:8px;padding:0 10px;font:inherit;font-size:13px;max-width:240px}
.usage-tip{background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--dsw-alias-label-secondary);flex-direction:row;flex-wrap:wrap;gap:6px 16px;align-items:center;display:flex}
.usage-tip b{color:var(--dsw-alias-label-primary)}
.usage-tip-empty{color:var(--dsw-alias-label-tertiary)}
.usage-legend{flex-direction:row;flex-wrap:wrap;gap:8px 14px;align-items:center;display:flex;font-size:12px;color:var(--dsw-alias-label-secondary)}
.usage-legend-item{flex-direction:row;gap:6px;align-items:center;display:inline-flex;cursor:pointer}
.usage-legend-item:hover{color:var(--dsw-alias-label-primary)}
.usage-legend-dot{width:10px;height:10px;border-radius:3px}
.usage-price{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;flex-direction:column;gap:10px;display:flex}
.usage-price-title{margin:0;font-size:14px;font-weight:600}
.usage-price-fields{flex-direction:row;gap:16px;display:flex;flex-wrap:wrap}
.usage-price-field{flex-direction:column;gap:6px;display:flex}
.usage-price-label{color:var(--dsw-alias-label-secondary);font-size:12px}
.usage-price-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;width:140px}
.usage-price-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.usage-save{border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:8px;height:32px;padding:0 16px;font-size:13px}
.usage-save:hover{background:var(--dsw-alias-interactive-bg-hover)}
.usage-save:disabled{opacity:.5;cursor:default}
.usage-saved{color:var(--dsw-alias-state-success-primary);font-size:12px}
.usage-error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px}`;
    const cssTag = "data-plugin-css=\"@deepseek-ai/dsh-client-ui-token-usage/css\"";
    if (typeof document !== "undefined" && document.querySelector("style[" + cssTag + "]") === null) {
      const tag = document.createElement("style");
      tag.setAttribute("data-plugin-css", "@deepseek-ai/dsh-client-ui-token-usage/css");
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    //#endregion

    const CATS = [
      { key: "cacheRead", label: "缓存命中输入" },
      { key: "input", label: "输入" },
      { key: "output", label: "输出" }
    ];
    const CHART_W = 640;
    const CHART_H = 270;
    const ML = 52, MR = 12, MT = 14, MB = 34;
    const plotW = CHART_W - ML - MR;
    const plotH = CHART_H - MT - MB;

    function tokenUsageRemote(ctx) {
      const service = ctx.get("remote.tokenUsage");
      if (service === undefined) throw new Error("tokenUsage Remote is unavailable");
      return service;
    }

    function UsageSection({ ctx }) {
      const el = react.createElement;
      const [period, setPeriod] = react.useState(7);
      const [filter, setFilter] = react.useState("");
      const [data, setData] = react.useState(null);
      const [hover, setHover] = react.useState(null);
      const [priceModel, setPriceModel] = react.useState("");
      const [draft, setDraft] = react.useState({ cacheRead: "", input: "", output: "" });
      const [saving, setSaving] = react.useState(false);
      const [saved, setSaved] = react.useState(false);
      const [error, setError] = react.useState(null);
      const [loaded, setLoaded] = react.useState(false);

      react.useEffect(() => {
        let alive = true;
        const load = async () => {
          try {
            const result = await tokenUsageRemote(ctx).get();
            if (!result.ok) {
              throw new Error("tokenUsage.get failed: " + result.error.code + ": " + result.error.message);
            }
            const res = result.value;
            if (!alive) return;
            setData(res);
            setError(null);
          } catch (e) {
            if (alive) setError(String((e && e.message) || e));
          } finally {
            if (alive) setLoaded(true);
          }
        };
        load();
        const timer = window.setInterval(load, 15000);
        return () => { alive = false; window.clearInterval(timer); };
      }, []);

      react.useEffect(() => {
        if (!data) return;
        const models = data.models || [];
        setFilter((cur) => (cur !== "" && !models.includes(cur)) ? "" : cur);
        setPriceModel((cur) => {
          let next = cur;
          if (next === "" && models.length) next = models[0];
          if (next !== "" && !models.includes(next)) next = models[0] || "";
          return next;
        });
      }, [data]);

      react.useEffect(() => {
        if (!data || !priceModel) return;
        const p = (data.prices && data.prices[priceModel]) || { cacheRead: 0, input: 0, output: 0 };
        setDraft({ cacheRead: String(p.cacheRead), input: String(p.input), output: String(p.output) });
        setSaved(false);
      }, [priceModel]);

      const models = data ? data.models : [];
      const win = data ? data.windows[String(period)] : null;
      const visible = filter === "" ? models : (models.includes(filter) ? [filter] : []);

      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      };
      const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
      const fmtCost = (n) => {
        if (!n) return "0";
        return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
      };
      const fmtAxis = (n) => {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
        return String(Math.round(n));
      };

      const onPrice = (key) => (event) => {
        setDraft((prev) => ({ ...prev, [key]: event.target.value }));
        setSaved(false);
      };

      const savePrices = async () => {
        if (!priceModel) return;
        setSaving(true);
        setSaved(false);
        try {
          const result = await tokenUsageRemote(ctx).setPrices({
            model: priceModel,
            prices: { cacheRead: toNum(draft.cacheRead), input: toNum(draft.input), output: toNum(draft.output) }
          });
          if (!result.ok) {
            throw new Error("tokenUsage.setPrices failed: " + result.error.code + ": " + result.error.message);
          }
          const res = result.value;
          setData((prev) => (prev ? { ...prev, prices: res.prices } : prev));
          setSaved(true);
          setError(null);
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setSaving(false);
        }
      };

      const catOf = (m, key) => (win && win.byModel[m] ? (win.byModel[m][key] || 0) : 0);

      const ranked = (() => {
        const totals = {};
        for (const m of visible) totals[m] = catOf(m, "cacheRead") + catOf(m, "input") + catOf(m, "output");
        return [...visible].sort((a, b) => totals[b] - totals[a]);
      })();

      const colorOf = (m) => {
        const idx = ranked.indexOf(m);
        if (idx === 0) return { fill: "var(--dsw-alias-brand-primary)", opacity: 1 };
        if (idx === 1) return { fill: "var(--dsw-alias-brand-primary)", opacity: 0.65 };
        if (idx === 2) return { fill: "var(--dsw-alias-brand-primary)", opacity: 0.38 };
        return { fill: "#8b9099", opacity: 0.6 };
      };

      const catTotals = CATS.map((cat) => ranked.reduce((s, m) => s + catOf(m, cat.key), 0));
      const maxTotal = Math.max(1, ...catTotals);
      const groupGap = 40;
      const groupW = (plotW - groupGap * 2) / 3;
      const barW = Math.min(46, groupW * 0.4);
      const yTicks = 4;

      const svgChildren = [];
      for (let i = 0; i <= yTicks; i++) {
        const v = (maxTotal / yTicks) * i;
        const y = MT + plotH - (v / maxTotal) * plotH;
        svgChildren.push(el("line", {
          key: "yl" + i, x1: ML, y1: y, x2: ML + plotW, y2: y,
          style: { stroke: "var(--dsw-alias-border-l1)", strokeWidth: 1 }
        }));
        svgChildren.push(el("text", {
          key: "yt" + i, x: ML - 6, y: y + 4, textAnchor: "end", fontSize: 10,
          style: { fill: "var(--dsw-alias-label-tertiary)" }
        }, fmtAxis(v)));
      }

      CATS.forEach((cat, ci) => {
        const gx = ML + ci * (groupW + groupGap);
        const x = gx + (groupW - barW) / 2;
        const catTotal = catTotals[ci];
        const barH = (catTotal / maxTotal) * plotH;
        let yCursor = MT + plotH;
        ranked.forEach((m) => {
          const val = catOf(m, cat.key);
          if (val <= 0) return;
          const segH = (val / catTotal) * barH;
          const y = yCursor - segH;
          yCursor = y;
          const col = colorOf(m);
          const price = data && data.prices && data.prices[m] ? (data.prices[m][cat.key] || 0) : 0;
          const cost = (val / 1e6) * price;
          const isHover = hover && hover.model === m && hover.cat === cat.key;
          svgChildren.push(el("rect", {
            key: ci + "-" + m,
            x, y, width: barW, height: Math.max(segH, 0.5), rx: 2,
            style: {
              fill: col.fill, opacity: hover && !isHover ? 0.3 : col.opacity,
              cursor: "pointer", transition: "opacity .15s"
            },
            onMouseEnter: () => setHover({ cat: cat.key, label: cat.label, model: m, value: val, cost, price }),
            onMouseLeave: () => setHover(null),
            onClick: () => setFilter(filter === m ? "" : m)
          }));
        });
        svgChildren.push(el("text", {
          key: "cl" + ci, x: gx + groupW / 2, y: CHART_H - 10, textAnchor: "middle", fontSize: 11,
          style: { fill: "var(--dsw-alias-label-secondary)" }
        }, cat.label));
      });

      const chart = win && models.length > 0
        ? el("div", { className: "usage-section" },
            hover
              ? el("div", { className: "usage-tip" },
                  el("span", null, el("b", null, hover.label), " · ", hover.model),
                  el("span", null, fmtInt(hover.value), " Tokens"),
                  el("span", null, "单价 ¥", fmtCost(hover.price), "/百万"),
                  el("span", null, "费用 ¥", fmtCost(hover.cost))
                )
              : el("div", { className: "usage-tip usage-tip-empty" }, "悬停柱子查看详情，点击柱子可按模型筛选"),
            el("svg", { viewBox: "0 0 " + CHART_W + " " + CHART_H, width: "100%", height: 270, style: { display: "block", flex: "none" } }, ...svgChildren),
            el("div", { className: "usage-legend" },
              ranked.map((m) => {
                const col = colorOf(m);
                return el("span", {
                  key: m, className: "usage-legend-item",
                  onClick: () => setFilter(filter === m ? "" : m)
                },
                  el("span", { className: "usage-legend-dot", style: { background: col.fill, opacity: col.opacity } }),
                  el("span", null, m)
                );
              }),
              filter !== "" ? el("span", { className: "usage-legend-item", onClick: () => setFilter("") }, "显示全部") : null
            )
          )
        : el("p", { className: "usage-intro" }, "暂无用量数据，产生模型调用后这里会显示柱状图。");

      const totalCost = win
        ? (filter === "" ? win.totals.cost : (win.byModel[filter] ? win.byModel[filter].cost : 0))
        : 0;

      const tabs = [1, 7, 30].map((d) =>
        el("button", {
          key: d, type: "button", role: "tab",
          className: "usage-tab",
          "data-active": d === period ? "true" : undefined,
          "aria-selected": d === period,
          onClick: () => setPeriod(d)
        }, d + " 天")
      );

      const priceFields = CATS.map((c) =>
        el("div", { key: c.key, className: "usage-price-field" },
          el("label", { className: "usage-price-label", htmlFor: "usage-price-" + c.key }, c.label),
          el("input", {
            id: "usage-price-" + c.key, type: "number", min: "0", step: "any",
            className: "usage-price-input", value: draft[c.key],
            onChange: onPrice(c.key), placeholder: "0.00"
          })
        )
      );

      return el("div", { className: "usage-section" },
        el("h2", { className: "usage-heading" }, "用量统计"),
        el("p", { className: "usage-intro" },
          data ? "已记录 " + fmtInt(data.count) + " 次模型调用，近 " + period + " 天费用合计 ¥" + fmtCost(totalCost) + "。" : "统计最近 1 / 7 / 30 天的模型 Token 用量并按模型单价估算费用。"
        ),
        el("div", { className: "usage-toolbar" },
          el("div", { className: "usage-tabs", role: "tablist", "aria-label": "统计周期" }, ...tabs),
          el("select", {
            className: "usage-select", value: filter, "aria-label": "按模型筛选",
            onChange: (e) => setFilter(e.target.value)
          },
            el("option", { key: "", value: "" }, "全部模型"),
            models.map((m) => el("option", { key: m, value: m }, m))
          )
        ),
        chart,
        el("div", { className: "usage-price" },
          el("h3", { className: "usage-price-title" }, "价格配置（每百万 Token）"),
          el("div", { className: "usage-price-fields" },
            el("div", { key: "model", className: "usage-price-field" },
              el("label", { className: "usage-price-label", htmlFor: "usage-price-model" }, "模型"),
              el("select", {
                id: "usage-price-model", className: "usage-select",
                value: priceModel, onChange: (e) => setPriceModel(e.target.value)
              },
                models.map((m) => el("option", { key: m, value: m }, m))
              )
            ),
            ...priceFields
          ),
          el("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
            el("button", { type: "button", className: "usage-save", disabled: saving, onClick: savePrices }, saving ? "保存中…" : "保存价格"),
            saved ? el("span", { className: "usage-saved" }, "已保存") : null,
            error ? el("p", { className: "usage-error" }, error) : null
          )
        ),
        !loaded ? el("p", { className: "usage-intro" }, "加载中…") : null
      );
    }

    const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    const isFiniteNonNegative = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
    const isPrice = (value) => isObject(value)
      && isFiniteNonNegative(value.cacheRead)
      && isFiniteNonNegative(value.input)
      && isFiniteNonNegative(value.output);

    function strictSchema(label, validate) {
      return {
        parse(value) {
          if (!validate(value)) throw new TypeError(label + " has an invalid shape");
          return value;
        }
      };
    }

    const usageSnapshotSchema = strictSchema("tokenUsage.get result", (value) => {
      if (!isObject(value) || !Array.isArray(value.models) || !isObject(value.prices)
        || !isObject(value.windows) || !Number.isInteger(value.count) || value.count < 0) return false;
      return value.models.every((model) => typeof model === "string")
        && Object.values(value.prices).every(isPrice)
        && ["1", "7", "30"].every((days) => {
          const period = value.windows[days];
          if (!isObject(period) || !isObject(period.totals) || !isObject(period.byModel)) return false;
          const totals = period.totals;
          if (![totals.cacheRead, totals.input, totals.output, totals.cost].every(isFiniteNonNegative)) return false;
          return Object.values(period.byModel).every((entry) => isObject(entry)
            && [entry.cacheRead, entry.input, entry.output, entry.cost].every(isFiniteNonNegative));
        });
    });
    const setPricesRequestSchema = strictSchema("tokenUsage.setPrices request", (value) => isObject(value)
      && typeof value.model === "string" && value.model.length > 0 && isPrice(value.prices));
    const setPricesResultSchema = strictSchema("tokenUsage.setPrices result", (value) => isObject(value)
      && isObject(value.prices) && Object.values(value.prices).every(isPrice));

    const TYPERT_REMOTE = {
      package: "@deepseek-ai/dsh-client-ui-token-usage",
      descriptors: [
        {
          id: "@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/get",
          service: "tokenUsage",
          namespace: "tokenUsage",
          method: "get",
          invocation: { kind: "direct" },
          parameters: [],
          result: {
            mode: "strict",
            typeSymbol: "@deepseek-ai/dsh-client-ui-token-usage#UsageSnapshot",
            schema: usageSnapshotSchema
          }
        },
        {
          id: "@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/setPrices",
          service: "tokenUsage",
          namespace: "tokenUsage",
          method: "setPrices",
          invocation: { kind: "direct" },
          parameters: [{
            name: "args",
            wire: "args",
            source: "json",
            codec: {
              mode: "strict",
              typeSymbol: "@deepseek-ai/dsh-client-ui-token-usage#SetPricesRequest",
              schema: setPricesRequestSchema
            }
          }],
          result: {
            mode: "strict",
            typeSymbol: "@deepseek-ai/dsh-client-ui-token-usage#SetPricesResult",
            schema: setPricesResultSchema
          }
        }
      ]
    };

    const inject = ["slots", "remote"];

    async function apply(ctx) {
      const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
      const slots = ctx.get("slots");
      if (slots === undefined) {
        await disposeRemote();
        return;
      }
      slots.inject("settings.section", () => slots.register(
        { name: "settings.section", id: "usage", order: 16, label: () => "用量统计" },
        (props) => react.createElement(UsageSection, { ctx })
      ));
      return disposeRemote;
    }

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
