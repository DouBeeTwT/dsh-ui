window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-token-usage",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");

    //#region css
    const css = `.usage-section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:8px;display:flex}
.usage-heading{margin:0;font-size:18px;font-weight:600}
.usage-intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px}
.usage-tabs{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:flex-end;gap:22px;margin-top:2px;padding:0 12px;display:flex}
.usage-tab{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;padding:7px 1px 9px;font-size:13px;line-height:20px;position:relative}
.usage-tab:hover,.usage-tab[data-active=true]{color:var(--dsw-alias-label-primary)}
.usage-tab[data-active=true]:after{background:var(--dsw-alias-label-primary);content:'';border-radius:2px 2px 0 0;height:2px;position:absolute;bottom:-1px;left:0;right:0}
.usage-tab-price{margin-left:auto}
.usage-view{flex-direction:column;gap:8px;display:flex}
.usage-heat{padding:14px 0;flex-direction:column;gap:10px;display:flex;position:relative}
.usage-rings{padding:14px 0;flex-direction:column;gap:10px;display:flex}
.usage-week{flex-direction:row;justify-content:space-between;display:flex}
.usage-week-day{flex-direction:column;gap:6px;align-items:center;display:flex;flex:1;min-width:0}
.usage-week-day-label{font-size:12px;color:var(--dsw-alias-label-secondary)}
.usage-price-divider{border:0;border-top:1px solid var(--dsw-alias-border-l1);margin:4px 0}
.usage-heat-title{margin:0;font-size:14px;font-weight:600}
.usage-heat-grid{overflow-x:auto}
.usage-heat-tip{background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--dsw-alias-label-secondary);flex-direction:column;gap:2px;display:flex}
.usage-heat-tip-date{color:var(--dsw-alias-label-primary);font-weight:600}
.usage-heat-tip-value{font-variant-numeric:tabular-nums}
.usage-summary{flex-direction:row;gap:10px;display:flex}
.usage-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:12px;padding:10px 14px;flex:1;min-width:0;flex-direction:column;gap:2px;display:flex}
.usage-card-label{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}
.usage-card-value{color:var(--dsw-alias-label-primary);font-size:16px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.usage-chart-row{flex-direction:row;gap:16px;align-items:flex-start;display:flex}
.usage-chart-main{flex:2;min-width:0;flex-direction:column;gap:8px;display:flex}
.usage-chart-wrap{position:relative}
.usage-tip{background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--dsw-alias-label-secondary);flex-direction:row;flex-wrap:wrap;gap:6px 16px;align-items:center;display:flex}
.usage-tip-float{position:absolute;z-index:20;pointer-events:none;max-width:280px;box-shadow:0 4px 16px rgba(0,0,0,.12)}
.usage-tip b{color:var(--dsw-alias-label-primary)}
.usage-tip-empty{color:var(--dsw-alias-label-tertiary)}
.usage-legend{flex:1;min-width:0;max-height:292px;overflow-y:auto;flex-direction:column;gap:6px;display:flex;padding-top:30px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.usage-legend-item{flex-direction:row;gap:8px;align-items:center;display:inline-flex;cursor:pointer;min-width:0;padding:2px 6px;border-radius:6px}
.usage-legend-item:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.usage-legend-item[data-active=true]{color:var(--dsw-alias-label-primary)}
.usage-legend-dot{width:10px;height:10px;border-radius:3px;flex:none}
.usage-legend-name{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.usage-legend-all{cursor:pointer;color:var(--dsw-alias-brand-primary);padding:2px 6px}
.usage-legend-all:hover{background:var(--dsw-alias-interactive-bg-hover)}
.usage-price{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;flex-direction:column;gap:10px;display:flex}
.usage-price-title{margin:0;font-size:14px;font-weight:600}
.usage-price-fields{flex-direction:row;gap:12px;display:flex;flex-wrap:nowrap;align-items:flex-end}
.usage-price-field{flex-direction:column;gap:6px;display:flex}
.usage-price-label{color:var(--dsw-alias-label-secondary);font-size:12px}
.usage-price-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:13px;width:92px}
.usage-price-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.usage-select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);height:32px;border-radius:8px;padding:0 10px;font:inherit;font-size:13px;max-width:240px}
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
      { key: "cacheRead", label: "缓存命中" },
      { key: "input", label: "输入" },
      { key: "output", label: "输出" }
    ];
    // 柱状图只画输入/输出两组；CATS（含缓存命中）仍供价格配置使用。
    const CHART_CATS = CATS.filter((c) => c.key !== "cacheRead");
    const CHART_W = 520;
    const CHART_H = 292;
    const ML = 56, MR = 12, MT = 0, MB = 38;
    const plotW = CHART_W - ML - MR;
    const plotH = CHART_H - MT - MB;
    const UNKNOWN_PURPLE = "#a78bfa";

    //#region Remote contract (tokenUsage namespace, mounted by this plugin)
    const passthroughSchema = { parse: (value) => value };
    const strictCodec = (typeSymbol) => ({ mode: "strict", typeSymbol, schema: passthroughSchema });

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
          result: strictCodec("@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/get:result")
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
            codec: strictCodec("@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/setPrices:args")
          }],
          result: strictCodec("@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/setPrices:result")
        },
        {
          id: "@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/setGoals",
          service: "tokenUsage",
          namespace: "tokenUsage",
          method: "setGoals",
          invocation: { kind: "direct" },
          parameters: [{
            name: "args",
            wire: "args",
            source: "json",
            codec: strictCodec("@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/setGoals:args")
          }],
          result: strictCodec("@deepseek-ai/dsh-client-ui-token-usage#tokenUsage/setGoals:result")
        }
      ]
    };

    function tokenUsageRemote(ctx) {
      const service = ctx.get("remote.tokenUsage");
      if (service === undefined) {
        throw new Error("tokenUsage Remote is unavailable");
      }
      return service;
    }

    async function usageGet(ctx) {
      const result = await tokenUsageRemote(ctx).get();
      if (!result.ok) {
        throw new Error(
          "tokenUsage.get failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }

    async function usageSetPrices(ctx, request) {
      const result = await tokenUsageRemote(ctx).setPrices(request);
      if (!result.ok) {
        throw new Error(
          "tokenUsage.setPrices failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }

    async function usageSetGoals(ctx, request) {
      const result = await tokenUsageRemote(ctx).setGoals(request);
      if (!result.ok) {
        throw new Error(
          "tokenUsage.setGoals failed: " +
          result.error.code +
          ": " +
          result.error.message
        );
      }
      return result.value;
    }
    //#endregion

    function UsageSection({ ctx }) {
      const el = react.createElement;
      const [period, setPeriod] = react.useState(1);
      const [view, setView] = react.useState("usage");
      const [filter, setFilter] = react.useState("");
      const [data, setData] = react.useState(null);
      const [hover, setHover] = react.useState(null);
      const [heatHover, setHeatHover] = react.useState(null);
      const [priceModel, setPriceModel] = react.useState("");
      const [draft, setDraft] = react.useState({ cacheRead: "", input: "", output: "" });
      const [goalDraft, setGoalDraft] = react.useState({ cost: "100", tokens: "100", count: "200" });
      const [saving, setSaving] = react.useState(false);
      const [saved, setSaved] = react.useState(false);
      const [goalSaving, setGoalSaving] = react.useState(false);
      const [goalSaved, setGoalSaved] = react.useState(false);
      const [error, setError] = react.useState(null);
      const [loaded, setLoaded] = react.useState(false);
      const chartTipRef = react.useRef(null);
      const heatTipRef = react.useRef(null);

      // 悬浮详情定位：跟随鼠标，绝对定位于定位祖先（图表容器）内，自动防溢出。
      const placeTip = (tip, e, dx = 14, dy = 18) => {
        if (!tip || !tip.offsetParent) return;
        const pr = tip.offsetParent.getBoundingClientRect();
        const tw = tip.offsetWidth || 120;
        const th = tip.offsetHeight || 40;
        let x = e.clientX - pr.left + dx;
        let y = e.clientY - pr.top + dy;
        if (x + tw > pr.width - 4) x = e.clientX - pr.left - tw - dx;
        if (y + th > pr.height - 4) y = e.clientY - pr.top - th - 4;
        tip.style.left = Math.max(4, x) + "px";
        tip.style.top = Math.max(4, y) + "px";
      };

      react.useEffect(() => {
        let alive = true;
        const load = async () => {
          try {
            const res = await usageGet(ctx);
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

      react.useEffect(() => {
        if (!data || !data.goals) return;
        // Token 上限以 M（百万）为单位展示；存储仍是原始 token 数。
        setGoalDraft({
          cost: String(data.goals.cost),
          tokens: String(data.goals.tokens / 1e6),
          count: String(data.goals.count),
        });
        setGoalSaved(false);
      }, [data]);

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
      // 卡片专用：费用保留两位小数，≥1000 用 K 简写
      const fmtCostCard = (n) => {
        if (n >= 1000) return "¥" + (n / 1000).toFixed(2) + "K";
        return "¥" + n.toFixed(2);
      };
      // 卡片/热力图专用：M(百万)/B(十亿) 简写，保留两位小数
      const fmtTokensCard = (n) => {
        if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
        return (n / 1e6).toFixed(2) + "M";
      };
      const fmtAxis = (n) => {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
        return String(Math.round(n));
      };
      // 缓存命中率：占比百分比，数字保留两位小数
      const fmtPercent = (n) => (n * 100).toFixed(2) + "%";

      const onPrice = (key) => (event) => {
        setDraft((prev) => ({ ...prev, [key]: event.target.value }));
        setSaved(false);
      };

      const savePrices = async () => {
        if (!priceModel) return;
        setSaving(true);
        setSaved(false);
        try {
          const res = await usageSetPrices(ctx, {
            model: priceModel,
            prices: { cacheRead: toNum(draft.cacheRead), input: toNum(draft.input), output: toNum(draft.output) }
          });
          setData((prev) => (prev ? { ...prev, prices: res.prices } : prev));
          setSaved(true);
          setError(null);
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setSaving(false);
        }
      };

      const onGoal = (key) => (event) => {
        setGoalDraft((prev) => ({ ...prev, [key]: event.target.value }));
        setGoalSaved(false);
      };

      const saveGoals = async () => {
        setGoalSaving(true);
        setGoalSaved(false);
        try {
          const res = await usageSetGoals(ctx, {
            // Token 上限输入为 M（百万），换算回原始 token 数存储。
            goals: { cost: toNum(goalDraft.cost), tokens: Math.round(toNum(goalDraft.tokens) * 1e6), count: Math.round(toNum(goalDraft.count)) }
          });
          setData((prev) => (prev ? { ...prev, goals: res.goals } : prev));
          setGoalSaved(true);
          setError(null);
        } catch (e) {
          setError(String((e && e.message) || e));
        } finally {
          setGoalSaving(false);
        }
      };

      const catOf = (m, key) => (win && win.byModel[m] ? (win.byModel[m][key] || 0) : 0);
      const totalOf = (m) => catOf(m, "cacheRead") + catOf(m, "input") + catOf(m, "output");

      // Ranking excludes "unknown" entirely; it always renders purple.
      const ranked = [...visible].filter((m) => m !== "unknown")
        .sort((a, b) => totalOf(b) - totalOf(a));
      const unknownVisible = visible.includes("unknown") ? ["unknown"] : [];
      const stackOrder = [...ranked, ...unknownVisible];

      const colorOf = (m) => {
        if (m === "unknown") return { fill: UNKNOWN_PURPLE, opacity: 1 };
        const idx = ranked.indexOf(m);
        if (idx === 0) return { fill: "var(--dsw-static-deepseek-500)", opacity: 1 };
        if (idx === 1) return { fill: "var(--dsw-static-deepseek-400)", opacity: 1 };
        if (idx === 2) return { fill: "var(--dsw-static-deepseek-300)", opacity: 1 };
        return { fill: "#8b9099", opacity: 0.6 };
      };

      const catTotals = CHART_CATS.map((cat) => stackOrder.reduce((s, m) => s + catOf(m, cat.key), 0));
      const maxTotal = Math.max(1, ...catTotals);
      const groupGap = 40;
      const groupW = (plotW - groupGap * (CHART_CATS.length - 1)) / CHART_CATS.length;
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
          key: "yt" + i, x: ML - 8, y: Math.max(y + 5, 10), textAnchor: "end", fontSize: 13,
          style: { fill: "var(--dsw-alias-label-tertiary)" }
        }, fmtAxis(v)));
      }

      CHART_CATS.forEach((cat, ci) => {
        const gx = ML + ci * (groupW + groupGap);
        const x = gx + (groupW - barW) / 2;
        const catTotal = catTotals[ci];
        const barH = (catTotal / maxTotal) * plotH;
        let yCursor = MT + plotH;
        stackOrder.forEach((m) => {
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
          key: "cl" + ci, x: gx + groupW / 2, y: CHART_H - 12, textAnchor: "middle", fontSize: 13,
          style: { fill: "var(--dsw-alias-label-secondary)" }
        }, cat.label));
      });

      const totals = win ? win.totals : { cacheRead: 0, input: 0, output: 0, cost: 0, count: 0 };
      const summaryCache = filter === "" ? totals.cacheRead : catOf(filter, "cacheRead");
      const summaryInput = filter === "" ? totals.input : catOf(filter, "input");
      const summaryOutput = filter === "" ? totals.output : catOf(filter, "output");
      const summaryTokens = summaryCache + summaryInput + summaryOutput;
      const summaryCost = win
        ? (filter === "" ? totals.cost : (win.byModel[filter] ? win.byModel[filter].cost : 0))
        : 0;

      const cards = [
        { key: "cost", label: "费用", value: fmtCostCard(summaryCost) },
        { key: "tokens", label: "总 Token", value: fmtTokensCard(summaryTokens) },
        // 缓存命中率：命中 ÷ (命中 + 普通输入)，不含输出。
        { key: "cacheHit", label: "缓存命中", value: fmtPercent((summaryCache + summaryInput) > 0 ? summaryCache / (summaryCache + summaryInput) : 0) }
      ];

      const chart = win && models.length > 0
        ? el("div", { className: "usage-chart-row" },
            el("div", { className: "usage-chart-main" },
              el("div", { className: "usage-chart-wrap", onMouseMove: (e) => placeTip(chartTipRef.current, e) },
                el("svg", { viewBox: "0 0 " + CHART_W + " " + CHART_H, width: "100%", height: 292, style: { display: "block", flex: "none" } }, ...svgChildren),
                el("div", {
                  ref: chartTipRef,
                  className: "usage-tip usage-tip-float",
                  style: { visibility: hover ? "visible" : "hidden" }
                },
                  hover
                    ? [
                        el("span", { key: "t1" }, el("b", null, hover.label), " · ", hover.model),
                        el("span", { key: "t2" }, fmtInt(hover.value), " Tokens"),
                        el("span", { key: "t3" }, "单价 ¥", fmtCost(hover.price), "/百万"),
                        el("span", { key: "t4" }, "费用 ¥", fmtCost(hover.cost))
                      ]
                    : null
                )
              )
            ),
            el("div", { className: "usage-legend" },
              stackOrder.map((m) => {
                const col = colorOf(m);
                return el("span", {
                  key: m, className: "usage-legend-item",
                  "data-active": filter === m ? "true" : undefined,
                  onClick: () => setFilter(filter === m ? "" : m)
                },
                  el("span", { className: "usage-legend-dot", style: { background: col.fill, opacity: col.opacity } }),
                  el("span", { className: "usage-legend-name", title: m }, m)
                );
              }),
              filter !== "" ? el("span", { className: "usage-legend-all", onClick: () => setFilter("") }, "显示全部") : null
            )
          )
        : el("p", { className: "usage-intro" }, "暂无用量数据，产生模型调用后这里会显示柱状图。");

      const tabs = [1, 7, 30].map((d) =>
        el("button", {
          key: d, type: "button", role: "tab",
          className: "usage-tab",
          "data-active": view === "usage" && d === period ? "true" : undefined,
          "aria-selected": view === "usage" && d === period,
          onClick: () => { setView("usage"); setPeriod(d); }
        }, d + " 天")
      );
      const priceTab = el("button", {
        key: "price", type: "button", role: "tab",
        className: "usage-tab usage-tab-price",
        "data-active": view === "price" ? "true" : undefined,
        "aria-selected": view === "price",
        onClick: () => setView("price")
      }, "价格");

      // Token 热力图：52 列 × 7 行，周一为首行，周日为末行，最右列是今天所在周。
      // 网格始终渲染：优先用宿主的 data.today 定锚；宿主尚未重启（无 daily/today
      // 字段）时回退到客户端本地今天，格子显示为灰色，重启 DSH 后自动出现颜色。
      const heatCells = [];
      let todayDate = null;
      if (data && data.today) {
        const parts = String(data.today).split("-").map(Number);
        todayDate = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        const nowD = new Date();
        todayDate = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
      }
      {
        const daysToSunday = (7 - todayDate.getDay()) % 7;
        const weekEnd = new Date(todayDate);
        weekEnd.setDate(weekEnd.getDate() + daysToSunday);
        const start = new Date(weekEnd);
        start.setDate(start.getDate() - 363);
        for (let i = 0; i < 364; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
          heatCells.push({
            i,
            key,
            tokens: (data && data.daily && data.daily[key]) || 0,
            future: d.getTime() > todayDate.getTime()
          });
        }
      }
      const heatColor = (tokens) => {
        if (tokens >= 1e8) return "var(--dsw-static-deepseek-500)";
        if (tokens >= 5e7) return "var(--dsw-static-deepseek-400)";
        if (tokens > 0) return "var(--dsw-static-deepseek-300)";
        // 零用量的"空格子"灰色：跟随主题 —— 浅色模式更浅、深色模式更深。
        return "var(--dsw-alias-bg-overlay)";
      };
      const HEAT_PITCH = 13;
      const HEAT_SIZE = 10;
      const HEAT_MONTH_LABEL_Y = 100;
      const heatMonthLabels = [];
      let lastMonth = -1;
      heatCells.forEach((c) => {
        const parts = c.key.split("-").map(Number);
        if (parts[2] === 1 && parts[1] !== lastMonth) {
          heatMonthLabels.push({ col: Math.floor(c.i / 7), label: parts[1] + "月" });
          lastMonth = parts[1];
        }
      });
      const heatMonthLabelViews = heatMonthLabels.map((m) =>
        el("text", {
          key: "m" + m.col, x: m.col * HEAT_PITCH, y: HEAT_MONTH_LABEL_Y,
          textAnchor: "start", fontSize: 11,
          style: { fill: "var(--dsw-alias-label-tertiary)" }
        }, m.label)
      );
      const heatCellsView = heatCells.map((c) => {
        const col = Math.floor(c.i / 7);
        const row = c.i % 7;
        return el("rect", {
          key: "h" + c.i,
          x: col * HEAT_PITCH, y: row * HEAT_PITCH, width: HEAT_SIZE, height: HEAT_SIZE, rx: 2,
          style: {
            fill: c.future ? "transparent" : heatColor(c.tokens),
            cursor: c.future ? "default" : "pointer",
            transition: "opacity .15s"
          },
          onMouseEnter: () => { if (!c.future) setHeatHover({ key: c.key, tokens: c.tokens }); },
          onMouseLeave: () => setHeatHover(null)
        });
      });
      const heatBlock = el("div", { className: "usage-heat" },
        el("h3", { className: "usage-heat-title" }, "活跃日历"),
        data && !data.daily
          ? el("p", { className: "usage-intro" }, "热力数据尚未就绪：请完全退出并重启 DSH（菜单栏图标 → 退出），刷新本页后即显示颜色。")
          : null,
        el("div", { className: "usage-heat-grid" },
          el("svg", {
            viewBox: "0 0 673 114", width: 673, height: 114,
            style: { display: "block", maxWidth: "100%" },
            onMouseMove: (e) => placeTip(heatTipRef.current, e, 12, 14)
          }, ...heatCellsView, ...heatMonthLabelViews)
        ),
        el("div", {
          ref: heatTipRef,
          className: "usage-heat-tip usage-tip-float",
          style: { visibility: heatHover ? "visible" : "hidden" }
        },
          heatHover
            ? (function () {
                var p = heatHover.key.split("-").map(Number);
                return [
                  el("div", { key: "d", className: "usage-heat-tip-date" }, p[1] + "月" + p[2] + "日"),
                  el("div", { key: "v", className: "usage-heat-tip-value" }, fmtTokensCard(heatHover.tokens))
                ];
              })()
            : null
        )
      );

      // 本周用量：周一到周日 7 个彩虹半圆图并排，每个半圆按当日 Token / Token 上限 填充，
      // 图下居中标注周几，无右侧文字说明。
      const g = data && data.goals ? data.goals : null;
      const WEEK_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      const dailyGoal = g && g.tokens > 0 ? g.tokens : 100000000;
      const goalsMap = {
        cost: g && g.cost > 0 ? g.cost : 100,
        tokens: dailyGoal,
        count: g && g.count > 0 ? g.count : 200
      };
      // 每个日期一个三环嵌套半圆图：外环费用(深蓝)、中环总Token(中间蓝)、内环请求次数(浅蓝)。
      // 环粗细 w=8；半径间距必须 ≥ 环粗，否则相邻环会重叠（外 30 / 中 19 / 内 8，
      // 环带 [26,34] / [15,23] / [4,12]，各留 3px 间隙）。
      const ringMeta = [
        { key: "cost", R: 30, color: "var(--dsw-static-deepseek-500)" },
        { key: "tokens", R: 19, color: "var(--dsw-static-deepseek-400)" },
        { key: "count", R: 8, color: "var(--dsw-static-deepseek-300)" }
      ];
      const weekDays = [];
      {
        let anchor = null;
        if (data && data.today) {
          const parts = String(data.today).split("-").map(Number);
          anchor = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          const nowD = new Date();
          anchor = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
        }
        const monday = new Date(anchor);
        monday.setDate(monday.getDate() - ((anchor.getDay() + 6) % 7));
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(d.getDate() + i);
          weekDays.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
        }
      }
      const dayRings = weekDays.map((key, i) => {
        const wd = data && data.week && data.week[i]
          ? data.week[i]
          : { cost: 0, tokens: (data && data.daily && data.daily[key]) || 0, count: 0 };
        const cx = 44, cy = 46, w = 8;
        const paths = [];
        ringMeta.forEach((rm) => {
          const p = goalsMap[rm.key] > 0 ? Math.min(1, Math.max(0, wd[rm.key] / goalsMap[rm.key])) : 0;
          const d = "M " + (cx - rm.R) + "," + cy + " A " + rm.R + "," + rm.R + " 0 0 1 " + (cx + rm.R) + "," + cy;
          // 灰色轨道：整条半圆，两端半圆收口（圆头）。
          paths.push(el("path", { key: "t" + rm.key, d, fill: "none", stroke: "var(--dsw-alias-bg-overlay)", strokeWidth: w, pathLength: 100, strokeLinecap: "round" }));
          // 彩色进度：仅当日有用量时才渲染（否则保持纯灰，避免出现彩色圆点）。
          if (wd[rm.key] > 0) {
            paths.push(el("path", { key: "p" + rm.key, d, fill: "none", stroke: rm.color, strokeWidth: w, pathLength: 100, strokeLinecap: "round", strokeDasharray: (p * 100).toFixed(2) + " 100" }));
          }
        });
        return el("div", { key: key, className: "usage-week-day" },
          el("svg", { viewBox: "0 0 88 52", width: 88, height: 52, style: { display: "block" } }, ...paths),
          el("span", { className: "usage-week-day-label" }, WEEK_LABELS[i])
        );
      });
      const ringsBlock = el("div", { className: "usage-rings" },
        el("h3", { className: "usage-heat-title" }, "每日目标"),
        el("div", { className: "usage-week" }, ...dayRings)
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

      const priceSection = el("div", { className: "usage-price" },
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
          saved ? el("span", { className: "usage-saved" }, "已保存") : null
        ),
        el("hr", { className: "usage-price-divider" }),
        el("h3", { className: "usage-price-title" }, "今日目标上限"),
        el("div", { className: "usage-price-fields" },
          el("div", { key: "cost", className: "usage-price-field" },
            el("label", { className: "usage-price-label", htmlFor: "usage-goal-cost" }, "费用上限（元）"),
            el("input", {
              id: "usage-goal-cost", type: "number", min: "0", step: "any",
              className: "usage-price-input", value: goalDraft.cost,
              onChange: onGoal("cost"), placeholder: "100"
            })
          ),
          el("div", { key: "tokens", className: "usage-price-field" },
            el("label", { className: "usage-price-label", htmlFor: "usage-goal-tokens" }, "Token 上限（M）"),
            el("input", {
              id: "usage-goal-tokens", type: "number", min: "0", step: "any",
              className: "usage-price-input", value: goalDraft.tokens,
              onChange: onGoal("tokens"), placeholder: "100"
            })
          ),
          el("div", { key: "count", className: "usage-price-field" },
            el("label", { className: "usage-price-label", htmlFor: "usage-goal-count" }, "请求上限（次）"),
            el("input", {
              id: "usage-goal-count", type: "number", min: "0", step: "1",
              className: "usage-price-input", value: goalDraft.count,
              onChange: onGoal("count"), placeholder: "200"
            })
          )
        ),
        el("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
          el("button", { type: "button", className: "usage-save", disabled: goalSaving, onClick: saveGoals }, goalSaving ? "保存中…" : "保存目标"),
          goalSaved ? el("span", { className: "usage-saved" }, "已保存") : null,
          error ? el("p", { className: "usage-error" }, error) : null
        )
      );

      return el("div", { className: "usage-section" },
        ringsBlock,
        heatBlock,
        el("h3", { className: "usage-heat-title" }, "用量统计"),
        el("div", { className: "usage-tabs", role: "tablist", "aria-label": "统计周期" }, ...tabs, priceTab),
        view === "price"
          ? priceSection
          : el("div", { className: "usage-view" },
              el("div", { className: "usage-summary" },
                cards.map((c) =>
                  el("div", { key: c.key, className: "usage-card" },
                    el("span", { className: "usage-card-label" }, c.label),
                    el("span", { className: "usage-card-value" }, c.value)
                  )
                )
              ),
              chart
            ),
        !loaded ? el("p", { className: "usage-intro" }, "加载中…") : null
      );
    }

    const inject = ["slots", "remote"];

    // 硬币图标 SVG path（与 icon/coin.svg 一致，viewBox 0 0 1024 1024）。
    const COIN_SVG_PATHS = '<path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"/><path d="M671.6 299h-59.5c-3 0-5.8 1.7-7.1 4.4l-90.6 180H511l-90.6-180c-1.4-2.7-4.1-4.4-7.1-4.4h-60.7c-1.3 0-2.6 0.3-3.8 1-3.9 2.1-5.3 7-3.2 10.9L457 515.7h-61.4c-4.4 0-8 3.6-8 8v29.9c0 4.4 3.6 8 8 8h81.7V603h-81.7c-4.4 0-8 3.6-8 8v29.9c0 4.4 3.6 8 8 8h81.7V717c0 4.4 3.6 8 8 8h54.3c4.4 0 8-3.6 8-8v-68.1h82c4.4 0 8-3.6 8-8V611c0-4.4-3.6-8-8-8h-82v-41.5h82c4.4 0 8-3.6 8-8v-29.9c0-4.4-3.6-8-8-8h-62l111.1-204.8c0.6-1.2 1-2.5 1-3.8-0.1-4.4-3.7-8-8.1-8z" fill="currentColor"/>';

    // 把设置面板导航中"用量"行的齿轮图标替换为硬币图标。
    // 用文本内容匹配导航按钮（不依赖位置序号），原 SVG 整体替换为硬币 SVG，
    // 使用 currentColor 自动适配深色/浅色模式。
    function patchCoinIcon() {
      if (typeof document === "undefined") return;
      const navCells = document.querySelectorAll('[role="dialog"] nav button');
      for (const cell of navCells) {
        const label = cell.querySelector("span");
        if (!label || label.textContent !== "用量") continue;
        const oldSvg = cell.querySelector("svg");
        if (!oldSvg) continue;
        if (oldSvg.getAttribute("data-coin") === "true") continue; // 已替换
        const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute("viewBox", "0 0 1024 1024");
        newSvg.setAttribute("width", "16");
        newSvg.setAttribute("height", "16");
        newSvg.setAttribute("fill", "none");
        newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        newSvg.setAttribute("data-coin", "true");
        newSvg.style.flex = "none";
        newSvg.innerHTML = COIN_SVG_PATHS;
        oldSvg.replaceWith(newSvg);
      }
    }

    async function apply(ctx) {
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
      slots.inject("settings.section", () => slots.register(
        { name: "settings.section", id: "usage", order: 16, label: () => "用量" },
        (props) => react.createElement(UsageSection, { ctx })
      ));
      // 监听设置面板 DOM 变化，在面板打开时替换导航图标。
      let observer = null;
      if (typeof document !== "undefined") {
        patchCoinIcon();
        observer = new MutationObserver(() => patchCoinIcon());
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
