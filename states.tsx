import * as preact from 'preact';
import { useState } from 'preact/hooks';

interface Loc {
  region: string,
  name: string;
  gdp: number;
  land: number;
  pop: number;
}

type LocField = 'gdp' | 'land' | 'pop';
type LandUnit = 'mi' | 'km';

function parse(region: string, tsv: string): Loc[] {
  return tsv.split('\n').map(line => {
    const [name, gdp, land, pop] = line.split('\t');
    return { region, name, gdp: parseFloat(gdp), land: parseFloat(land), pop: parseFloat(pop) };
  });
}

const us = parse('us', `California	3598103	163694.74	39029342
Texas	2355960	268596.46	30029572
New York	2053180	54554.98	19677151
Florida	1389070	65757.70	22244823
Illinois	1033310	57913.55	12582032
Pennsylvania	923089	46054.34	12972008
Ohio	822670	44825.58	11756058
Georgia	755698	59425.15	10912876
New Jersey	745422	8722.58	9261699
North Carolina	730072	53819.16	10698973
Washington	725514	71297.95	7785786
Massachusetts	688392	10554.39	6981974
Virginia	649393	42774.93	8683619
Michigan	620696	96713.51	10034113
Colorado	484372	104093.67	5839926
Tennessee	475755	42144.25	7051339
Maryland	470187	12405.93	6164660
Arizona	458950	113990.30	7359197
Indiana	455750	36419.55	6833037
Minnesota	446500	86935.83	5717184
Wisconsin	401792	65496.38	5892539
Missouri	389931	69706.99	6177957
Connecticut	321845	5543.41	3626205
Oregon	299125	98378.54	4240137
South Carolina	295880	32020.49	5282634
Louisiana	281429	52378.13	4590241
Alabama	277817	52420.07	5074296
Kentucky	260304	40407.80	4512310
Utah	248176	84896.88	3380800
Oklahoma	240534	69898.87	4019800
Iowa	231108	56272.81	3200517
Nevada	215918	110571.82	3177772
Kansas	210670	82278.36	2937150
Arkansas	165221	53178.55	3045637
Nebraska	161702	77347.81	1967923
Mississippi	138740	48431.78	2940057
New Mexico	122115	121590.30	2113344
Idaho	109546	83568.95	1939033
New Hampshire	105414	9349.16	1395231
Hawaii	98219	10931.72	1440196
West Virginia	95588	24230.04	1775156
Delaware	87525	2488.72	1018396
Maine	84497	35379.74	1385340
North Dakota	73267	70698.32	779261
Rhode Island	71402	1544.89	1093734
South Dakota	67571	77115.68	909824
Montana	65015	147039.71	1122867
Alaska	63618	665384.04	733583
Wyoming	47433	97813.01	581381
Vermont	40617	9616.36	647064`);

const eu = parse('eu', `Germany	4308.850	357386	83408554
United Kingdom	3158.938	242495	67281039
France	2923.489	551695	64531444
Italy	2169.745	301318	59240329
Russia	2062.649	3968200	145102755
Spain	1492.432	498511	47486935
Netherlands	1080.880	41198	17501696
Turkey	1029.303	23764	84775404
Switzerland	869.601	41290	8691406
Poland	748.887	312685	38307726
Sweden	599.052	447425	10467097
Belgium	624.248	30510	11611419
Norway	554.105	385178	5403021
Ireland	594.095	70273	4986526
Austria	515.199	83858	8922082
Denmark	405.626	44493	5854240
Romania	348.902	238397	19328560
Finland	301.670	338145	5535992
Czech Republic	330.483		10510751
Portugal	267.721	88416	10290103
Greece	239.300	131940	10445365
Ukraine	148.712	603628	43531422
Hungary	188.505	93030	9709786
Slovakia	127.533	49036	5447622
Bulgaria	100.635	110994	6885868
Luxembourg	86.971	2586	639321
Belarus	73.543	207600	9578167
Croatia	78.881	56594	4060135
Lithuania	78.346	65300	2786651
Slovenia	68.108	20273	2119410
Serbia	73.961	88361	7296769
Azerbaijan	70.030	6960	10312992
Latvia	47.398	64589	1873919
Estonia	41.551	45339	1328701
Cyprus	30.864	0	1244188
Iceland	28.625	102775	370335
Bosnia and Herzegovina	28.488	51129	3270943
Georgia	27.947	2642	3757980
Albania	20.177	28748	2854710
Malta	19.405	316	526748
North Macedonia	15.278	25713	2103330
Armenia	23.725	0	2790974
Moldova	15.829	33846	3061506
Kosovo	9.990		1662009
Montenegro	7.027	13812	627859
Andorra	3.669	468	79034
San Marino	1.807	61	33745
Liechtenstein		160	39039
Monaco		2	36686`);
for (const country of eu) {
  country.gdp *= 1000;  // normalize to $m
  country.land /= 2.59;  // normalize to sqmi
}

function match(src: Loc, field: LocField, dsts: Loc[]) {
  const dists = dsts.map((dst, i) => {
    const dist = dst[field] - src[field];
    return { i, dist };
  });
  dists.sort((a, b) => Math.abs(a.dist) - Math.abs(b.dist));
  return dists.slice(0, 5).map(({ i }) => dsts[i]);
}

function relPct(a: number, b: number) {
  const pct = ((b - a) * 100 / a);
  let str = `${pct.toFixed(1)}%`;
  if (pct > 0) {
    str = '+' + str;
  }
  return <small>{str}</small>;
}

function showStat(loc: Loc, field: LocField, landUnit: LandUnit): string {
  switch (field) {
    case 'gdp': return `${(loc.gdp / 1000).toFixed(1)}`;
    case 'land': {
      let land = loc.land;
      if (landUnit == 'km') land *= 2.59;
      land /= 1000;
      return `${land.toFixed(0)}k`;
    }
    case 'pop': return `${(loc.pop / 1_000_000).toFixed(1)}`;
  };
}

function Selected({ loc, landUnit, setLandUnit }: { loc: Loc, landUnit: LandUnit, setLandUnit: (l: LandUnit) => void }) {
  return <div>
    <table>
      <tr><td class='r'>GDP:</td><td>${showStat(loc, 'gdp', landUnit)} billion USD</td></tr>
      <tr><td class='r'>Land:</td><td>{showStat(loc, 'land', landUnit)}&nbsp;
        <select value={landUnit} onChange={e => setLandUnit((e.target as HTMLOptionElement).value as LandUnit)}>
          <option value='mi'>sq mi</option>
          <option value='km'>sq km</option>
        </select>
      </td></tr>
      <tr><td class='r'>Population:</td><td>{showStat(loc, 'pop', landUnit)} million</td></tr>
    </table>
  </div>;
}

function Combobox({ initial, options, commit }: { initial: string, options: string[], commit: (input: string) => void }) {
  const [value, setValue] = useState(initial);
  const [focus, setFocus] = useState(false);

  function choose(val: string) { setValue(val); commit(val); }

  let optionsDOM;
  if (focus) {
    options = options.filter(o => o !== value && o.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
    if (options.length > 0) {
      optionsDOM = <div class='popup'>
        {options.map(o => <div class='entry' onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o)}>{o}</div>)}
      </div>;
    }
  }

  return <div class='combo'>
    <input type='text' value={value}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      onInput={e => setValue((e.target as HTMLInputElement).value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && options.length > 0) {
          choose(options[0]);
        }
      }}
      onChange={e => choose((e.target as HTMLInputElement).value)} />
    {optionsDOM}
  </div>;
}

function Picker({ loc, setLoc }: { loc: Loc | undefined, setLoc: (loc: Loc | undefined) => void }) {
  const [locName, setLocName] = useState('');

  let cur = us.find((loc) => loc.name === locName);
  if (!cur) {
    cur = eu.find((loc) => loc.name === locName);
  }
  if (loc !== cur) setLoc(cur);

  return <h2>
    Region: <Combobox initial={loc?.name ?? ''} options={us.concat(eu).map(loc => loc.name)} commit={setLocName} />
  </h2>;
}


function Comparables({ src, top, landUnit, axis, setAxis }: { src: Loc, top: Loc[], landUnit: LandUnit, axis: LocField, setAxis: (f: LocField) => void }) {
  function row(loc: Loc) {
    return <tr>
      <td>{loc.name}</td>
      <td class='r'>{showStat(loc, 'gdp', landUnit)}</td> <td class='r'>{relPct(src.gdp, loc.gdp)}</td>
      <td class='r'>{showStat(loc, 'land', landUnit)}</td><td class='r'>{relPct(src.land, loc.land)}</td>
      <td class='r'>{showStat(loc, 'pop', landUnit)}</td> <td class='r'>{relPct(src.pop, loc.pop)}</td>
    </tr>;
  }

  return <div>
    <h2>Comparables, by{' '}
      <select value={axis} onChange={e => setAxis((e.target as HTMLSelectElement).value as LocField)}>
        <option value='gdp'>GDP</option>
        <option value='land'>Land</option>
        <option value='pop'>Population</option>
      </select>
    </h2>
    <table width='100%'>
      <tr>
        <th></th>
        <th colSpan={2}>GDP ($b USD)</th>
        <th colSpan={2}>Land (sq {landUnit})</th>
        <th colSpan={2}>Pop (m)</th>
      </tr>
      {top.map(row)}
    </table>
  </div>;
}

function UI() {
  const [loc, setLoc] = useState<Loc | undefined>(undefined);
  const [landUnit, setLandUnit] = useState<LandUnit>('mi');
  const [axis, setAxis] = useState<LocField>('gdp');
  return <div>
    <Picker loc={loc} setLoc={setLoc} />
    {loc ? <Selected loc={loc} landUnit={landUnit} setLandUnit={setLandUnit} /> : null}
    {loc ? <Comparables src={loc} top={match(loc, axis, loc.region === 'us' ? eu : us)} landUnit={landUnit} axis={axis} setAxis={setAxis} /> : null}
  </div>;
}

preact.render(<UI />, document.getElementById('out')!);
