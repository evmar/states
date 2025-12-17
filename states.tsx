import * as preact from "preact";
import {
  Signal,
  signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import data from "./data.json";

interface Loc {
  region: string;
  name: string;
  gdp: number;
  gdpPerCapita: number;
  land: number;
  pop: number;
  hdi: number;
}

type LocField = "gdp" | "land" | "pop" | "hdi";
type LandUnit = "mi" | "km";
const landUnit = signal<LandUnit>("mi");

const gdpUnit = signal<"" | "per capita">("");

function load(
  region: "us" | "eu",
  data: Array<[string, number, number, number, number]>,
): Loc[] {
  return data.map(([name, gdp, land, pop, hdi]) => {
    const gdpPerCapita = gdp / pop;
    return { region, name, gdp, gdpPerCapita, land, pop, hdi };
  });
}
const us = load("us", data["us"] as any);
const eu = load("eu", data["eu"] as any);

function match(src: Loc, field: LocField | "gdpPerCapita", dsts: Loc[]) {
  const dists = dsts.map((dst, i) => {
    const dist = dst[field] - src[field];
    return { i, dist };
  });
  dists.sort((a, b) => Math.abs(a.dist) - Math.abs(b.dist));
  const locs = dists.slice(0, 7).map(({ i }) => dsts[i]);
  locs.push(src);
  locs.sort((a, b) => a[field] - b[field]);
  return locs;
}

function relPct(a: number, b: number) {
  const pct = ((b - a) * 100) / a;
  let str = `${pct.toFixed(1)}%`;
  if (pct > 0) {
    str = "+" + str;
  }
  return <small>{str}</small>;
}

function showStat(loc: Loc, field: LocField): string {
  switch (field) {
    case "gdp": {
      if (gdpUnit.value === "per capita") {
        return `${(loc.gdpPerCapita * 1000).toFixed(1)}k`;
      } else {
        return `${(loc.gdp / 1000).toFixed(1)}b`;
      }
    }
    case "land": {
      let land = loc.land;
      if (landUnit.value === "mi") land /= 2.59;
      if (land > 1000) {
        return `${(land / 1000).toFixed(0)}k`;
      } else {
        return `${land.toFixed(0)}`;
      }
    }
    case "pop":
      if (loc.pop > 500_000) {
        return `${(loc.pop / 1_000_000).toFixed(1)}m`;
      } else {
        return `${(loc.pop / 1_000).toFixed(0)}k`;
      }
    case "hdi":
      return `${loc.hdi.toFixed(3)}`;
  }
}

/** Table with verbose stats about the single selected location. */
function Selected({ loc }: { loc: Loc }) {
  return (
    <div>
      <table>
        <tr>
          <td class="r">Land:</td>
          <td>
            {showStat(loc, "land")}&nbsp;
            <select
              value={landUnit}
              onChange={(e) =>
                (landUnit.value = (e.target as HTMLOptionElement)
                  .value as LandUnit)
              }
            >
              <option value="mi">sq mi</option>
              <option value="km">sq km</option>
            </select>
          </td>
        </tr>
        <tr>
          <td class="r">Population:</td>
          <td>{showStat(loc, "pop")}</td>
        </tr>
        <tr>
          <td class="r">GDP:</td>
          <td>
            ${showStat(loc, "gdp")} USD&nbsp;
            <select
              value={gdpUnit}
              onChange={(e) =>
                (gdpUnit.value = (e.target as HTMLOptionElement).value as
                  | ""
                  | "per capita")
              }
            >
              <option value=""></option>
              <option value="per capita">per capita</option>
            </select>
          </td>
        </tr>
        <tr>
          <td class="r">HDI:</td>
          <td>{showStat(loc, "hdi")}</td>
        </tr>
      </table>
    </div>
  );
}

function Combobox({
  text,
  options,
}: {
  text: Signal<string>;
  options: string[];
}) {
  const focus = useSignal(false);

  let filteredOptions = useComputed(() => {
    const filtered = options.filter(
      (o) =>
        o !== text.value &&
        o.toLowerCase().startsWith(text.value.toLowerCase()),
    );
    return filtered.slice(0, 5);
  });
  let optionsDOM;
  if (focus.value) {
    if (filteredOptions.value.length > 0) {
      optionsDOM = (
        <div class="popup">
          {filteredOptions.value.map((o) => (
            <div
              class="entry"
              onMouseDown={(e) => e.preventDefault()} // prevent blur event
              onClick={() => (text.value = o)}
            >
              {o}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div class="combo">
      <input
        type="text"
        value={text}
        onFocus={() => (focus.value = true)}
        onBlur={() => (focus.value = false)}
        onInput={(e) => (text.value = (e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filteredOptions.value.length > 0) {
            text.value = filteredOptions.value[0];
          }
        }}
        onChange={(e) => (text.value = (e.target as HTMLInputElement).value)}
      />
      {optionsDOM}
    </div>
  );
}

const allRegions = us
  .concat(eu)
  .map((loc) => loc.name)
  .sort();

function Picker({ loc }: { loc: Signal<Loc | undefined> }) {
  const locName = useSignal("");
  useSignalEffect(() => {
    let cur = us.find((loc) => loc.name === locName.value);
    if (!cur) {
      cur = eu.find((loc) => loc.name === locName.value);
    }
    loc.value = cur;
  });

  return (
    <h2>
      Region: <Combobox text={locName} options={allRegions} />
    </h2>
  );
}

function Comparables({
  src,
  top,
  axis,
}: {
  src: Loc;
  top: Loc[];
  axis: Signal<LocField>;
}) {
  function row(loc: Loc) {
    return (
      <tr>
        <td>{loc.name}</td>
        <td class="r">{showStat(loc, "land")}</td>
        <td class="r">{src !== loc && relPct(src.land, loc.land)}</td>
        <td class="r">{showStat(loc, "pop")}</td>
        <td class="r">{src !== loc && relPct(src.pop, loc.pop)}</td>
        <td class="r">{showStat(loc, "gdp")}</td>
        <td class="r">
          {src !== loc
            ? gdpUnit.value === ""
              ? relPct(src.gdp, loc.gdp)
              : relPct(src.gdpPerCapita, loc.gdpPerCapita)
            : null}
        </td>
        <td class="r">{showStat(loc, "hdi")}</td>
      </tr>
    );
  }

  return (
    <div>
      <h2>
        Comparables, by{" "}
        <select
          value={axis}
          onChange={(e) =>
            (axis.value = (e.target as HTMLSelectElement).value as LocField)
          }
        >
          <option value="land">Land</option>
          <option value="pop">Population</option>
          <option value="gdp">GDP</option>
          <option value="hdi">HDI</option>
        </select>
      </h2>
      <table width="100%">
        <tr>
          <th></th>
          <th colSpan={2}>Land (sq {landUnit})</th>
          <th colSpan={2}>Population</th>
          <th colSpan={2}>GDP (${gdpUnit.value === "" ? "" : "/person"})</th>
          <th colSpan={2}>HDI</th>
        </tr>
        {top.map(row)}
      </table>
    </div>
  );
}

function Location({ loc, axis }: { loc: Signal<Loc>; axis: Signal<LocField> }) {
  const top = useComputed(() => {
    let field: LocField | "gdpPerCapita" = axis.value;
    if (field === "gdp" && gdpUnit.value === "per capita") {
      field = "gdpPerCapita";
    }
    return match(loc.value, field, loc.value.region === "us" ? eu : us);
  });
  return (
    <div>
      <Selected loc={loc.value!} />
      <Comparables src={loc.value!} top={top.value} axis={axis} />
    </div>
  );
}

function UI() {
  const loc = useSignal<Loc | undefined>(undefined);
  const axis = useSignal<LocField>("land");
  return (
    <div>
      <Picker loc={loc} />
      {loc.value ? <Location loc={loc as Signal<Loc>} axis={axis} /> : null}
    </div>
  );
}

preact.render(<UI />, document.getElementById("out")!);
