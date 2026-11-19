import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Check, Info, Laptop, MessageCircle, Smartphone, Tablet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../utils/whatsapp';

type DeviceType = 'macbook' | 'ipad' | 'iphone';

interface ModelGroup {
  id: string;
  deviceType: DeviceType;
  label: string;
  exampleModels: string;
  multiplier: number;
}

interface IssueEstimate {
  id: string;
  deviceTypes: DeviceType[];
  title: string;
  serviceName: string;
  category: string;
  baseMin: number;
  baseMax: number;
  turnaround: string;
  checks: string[];
}

const DEVICE_TABS: { id: DeviceType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'macbook', label: 'MacBook', icon: Laptop },
  { id: 'ipad', label: 'iPad / Tablet', icon: Tablet },
  { id: 'iphone', label: 'iPhone', icon: Smartphone },
];

const MODEL_GROUPS: ModelGroup[] = [
  // Original Apple MacBook Models
  {
    id: 'air-intel',
    deviceType: 'macbook',
    label: 'MacBook Air (Intel 2015–2020)',
    exampleModels: 'A1466 / A1932 / A2179',
    multiplier: 0.85,
  },
  {
    id: 'air-m1',
    deviceType: 'macbook',
    label: 'MacBook Air 13" (Apple M1)',
    exampleModels: 'A2337 (2020)',
    multiplier: 1.0,
  },
  {
    id: 'air-m2',
    deviceType: 'macbook',
    label: 'MacBook Air 13" & 15" (Apple M2)',
    exampleModels: 'A2681 / A2941 (2022–2023)',
    multiplier: 1.2,
  },
  {
    id: 'air-m3-m4',
    deviceType: 'macbook',
    label: 'MacBook Air 13" & 15" (Apple M3 / M4)',
    exampleModels: 'A3113 / A3114 / A3240 / A3241',
    multiplier: 1.32,
  },
  {
    id: 'pro-13-intel-m1-m2',
    deviceType: 'macbook',
    label: 'MacBook Pro 13" (Intel / M1 / M2)',
    exampleModels: 'A1706 / A1989 / A2159 / A2289 / A2338',
    multiplier: 1.05,
  },
  {
    id: 'pro-14-16-silicon',
    deviceType: 'macbook',
    label: 'MacBook Pro 14" & 16" (M1 / M2 / M3 / M4 Pro/Max)',
    exampleModels: 'A2442 / A2485 / A2779 / A2918 / A2991 / A3112',
    multiplier: 1.45,
  },
  {
    id: 'pro-15-16-intel',
    deviceType: 'macbook',
    label: 'MacBook Pro 15" & 16" (Intel Core)',
    exampleModels: 'A1707 / A1990 / A2141',
    multiplier: 1.2,
  },

  // Original Apple iPad Models
  {
    id: 'ipad-std-mini',
    deviceType: 'ipad',
    label: 'iPad (8th / 9th / 10th Gen / A16) & iPad Mini (5 / 6 / 7)',
    exampleModels: 'A2602 / A2696 / A2757 / A2567 / A2993',
    multiplier: 0.65,
  },
  {
    id: 'ipad-air',
    deviceType: 'ipad',
    label: 'iPad Air 11" & 13" (4th / 5th Gen / M2)',
    exampleModels: 'A2316 / A2588 / A2902 / A2898',
    multiplier: 0.85,
  },
  {
    id: 'ipad-pro',
    deviceType: 'ipad',
    label: 'iPad Pro 11" & 13" (M1 / M2 / M4)',
    exampleModels: 'A2377 / A2435 / A2759 / A2836 / A2925',
    multiplier: 1.15,
  },

  // Original Apple iPhone Models
  {
    id: 'iphone-11-12',
    deviceType: 'iphone',
    label: 'iPhone 11 / 12 / 12 Pro / 12 Pro Max',
    exampleModels: 'A2221 / A2403 / A2407 / A2411',
    multiplier: 0.55,
  },
  {
    id: 'iphone-13-14',
    deviceType: 'iphone',
    label: 'iPhone 13 / 13 Pro / 14 / 14 Pro / Pro Max',
    exampleModels: 'A2633 / A2638 / A2882 / A2890 / A2894',
    multiplier: 0.72,
  },
  {
    id: 'iphone-15',
    deviceType: 'iphone',
    label: 'iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max',
    exampleModels: 'A3090 / A3094 / A3102 / A3106',
    multiplier: 0.88,
  },
  {
    id: 'iphone-16',
    deviceType: 'iphone',
    label: 'iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max',
    exampleModels: 'A3287 / A3290 / A3293 / A3296',
    multiplier: 1.02,
  },
];

const ISSUE_ESTIMATES: IssueEstimate[] = [
  // MacBook Issues
  {
    id: 'mb-display',
    deviceTypes: ['macbook'],
    title: 'Cracked or Damaged Retina Display',
    serviceName: 'MacBook Screen Replacement',
    category: 'MacBook Display Repair',
    baseMin: 12500,
    baseMax: 24500,
    turnaround: 'Same Day – 24 Hours (subject to panel availability)',
    checks: [
      'Full LCD / Mini-LED assembly fitment inspection',
      'True Tone, brightness & camera cable check',
      'Hinge tension & lid alignment verification',
    ],
  },
  {
    id: 'mb-backlight-flex',
    deviceTypes: ['macbook'],
    title: 'Black Screen, Lines, or Flickering Backlight',
    serviceName: 'Backlight Issue',
    category: 'MacBook Display Repair',
    baseMin: 4500,
    baseMax: 11500,
    turnaround: '1 – 2 Working Days',
    checks: [
      'External monitor output & backlight voltage rail check',
      'eDP flex / lid-angle sensor inspection',
      'Board-level driver IC testing before panel swap',
    ],
  },
  {
    id: 'mb-logic-board',
    deviceTypes: ['macbook'],
    title: 'No Power / Dead Motherboard / Chip-Level Fault',
    serviceName: 'MacBook Motherboard Repair',
    category: 'MacBook Hardware Repair',
    baseMin: 4500,
    baseMax: 12000,
    turnaround: '1 – 3 Working Days',
    checks: [
      'Leica microscope inspection & short-circuit rail isolation',
      'PPBUS_G3H / 5V–20V USB-C power negotiation trace',
      'Micro-soldering to preserve original logic board & data',
    ],
  },
  {
    id: 'mb-liquid',
    deviceTypes: ['macbook'],
    title: 'Water, Coffee, or Liquid Spill Damage',
    serviceName: 'Water Damage MacBook Repair',
    category: 'Liquid Damage Repair',
    baseMin: 3500,
    baseMax: 11500,
    turnaround: '1 – 3 Working Days',
    checks: [
      'Immediate battery disconnect & ultrasonic PCB wash',
      'Corrosion & oxidized trace restoration under microscope',
      'Multi-rail load & keyboard membrane testing',
    ],
  },
  {
    id: 'mb-battery',
    deviceTypes: ['macbook'],
    title: 'Battery Replacement / "Service Recommended"',
    serviceName: 'MacBook Battery Replacement',
    category: 'Battery & Charging',
    baseMin: 4200,
    baseMax: 8500,
    turnaround: '2 – 4 Hours',
    checks: [
      'Cycle count, full-charge capacity & thermal sensor check',
      'Safe adhesive removal without bending trackpad/frame',
      'Charging calibration & idle drain verification',
    ],
  },
  {
    id: 'mb-charging-port',
    deviceTypes: ['macbook'],
    title: 'USB-C / MagSafe Port or Charging IC Failure',
    serviceName: 'Charging Circuit Repair',
    category: 'Battery & Charging',
    baseMin: 2800,
    baseMax: 7500,
    turnaround: 'Same Day – 24 Hours',
    checks: [
      'USB-C ammeter negotiation & CD3215/CD3217 controller check',
      'Modular DC-in / Thunderbolt jack continuity inspection',
      'Adapter wattage & dual-port PD handshake test',
    ],
  },
  {
    id: 'mb-keyboard-trackpad',
    deviceTypes: ['macbook'],
    title: 'Keyboard Keys Stuck or Trackpad Unresponsive',
    serviceName: 'Keyboard Replacement',
    category: 'MacBook Hardware Repair',
    baseMin: 3500,
    baseMax: 8500,
    turnaround: 'Same Day – 24 Hours',
    checks: [
      'Key switch matrix & topcase flex cable inspection',
      'Force Touch haptic actuator & battery swelling check',
      'Post-install key travel & Touch ID / power key verification',
    ],
  },
  {
    id: 'mb-overheating-fan',
    deviceTypes: ['macbook'],
    title: 'Overheating, Loud Fan Noise, or Thermal Throttling',
    serviceName: 'Overheating Problems',
    category: 'Other Repairs',
    baseMin: 1500,
    baseMax: 4200,
    turnaround: '2 – 4 Hours',
    checks: [
      'Heatsink dust extraction & fin channel cleanup',
      'High-conductivity thermal paste application',
      'RPM sensor & load-temperature stress test',
    ],
  },
  {
    id: 'mb-macos-software',
    deviceTypes: ['macbook'],
    title: 'macOS Boot Loop, Recovery, or DFU Restore',
    serviceName: 'macOS Recovery',
    category: 'Software & Performance',
    baseMin: 1200,
    baseMax: 2800,
    turnaround: 'Same Day',
    checks: [
      'APFS container health & SSD SMART diagnostics',
      'Clean macOS install or Apple Configurator DFU revive',
      'Pre-repair data backup consultation where readable',
    ],
  },

  // iPad / Tablet Issues
  {
    id: 'ipad-screen',
    deviceTypes: ['ipad'],
    title: 'Cracked Glass Touch Digitizer or Display Assembly',
    serviceName: 'iPad Screen & Digitizer Replacement',
    category: 'iPad Display Repair',
    baseMin: 5500,
    baseMax: 18500,
    turnaround: 'Same Day – 24 Hours',
    checks: [
      'Touch responsiveness & Apple Pencil palm-rejection verification',
      'Housing corner straightening before re-sealing',
      'Face ID / Touch ID flex protection inspection',
    ],
  },
  {
    id: 'ipad-battery',
    deviceTypes: ['ipad'],
    title: 'iPad Battery Replacement / Rapid Drain',
    serviceName: 'iPad Battery Replacement',
    category: 'iPad Battery Service',
    baseMin: 4000,
    baseMax: 8800,
    turnaround: 'Same Day (3 – 5 Hours)',
    checks: [
      'Controlled screen lift without stressing laminated display',
      'High-density battery cell capacity check',
      'Charge-rate & standby drain verification',
    ],
  },
  {
    id: 'ipad-charging-ic',
    deviceTypes: ['ipad'],
    title: 'Not Charging / USB-C Port or Logic Board Fault',
    serviceName: 'iPad Charging & Board Repair',
    category: 'iPad Hardware Repair',
    baseMin: 3500,
    baseMax: 9500,
    turnaround: '1 – 2 Working Days',
    checks: [
      'USB-C / Lightning dock pin continuity & Hydra/Tristar IC check',
      'Primary VDD_MAIN rail short-circuit isolation',
      'Data preservation check during board rework',
    ],
  },
  {
    id: 'ipad-liquid',
    deviceTypes: ['ipad'],
    title: 'Water Spill / Dead iPad Micro-Soldering',
    serviceName: 'iPad Liquid Damage Recovery',
    category: 'iPad Liquid Recovery',
    baseMin: 3800,
    baseMax: 10500,
    turnaround: '1 – 3 Working Days',
    checks: [
      'Ultrasonic PCB cleaning & oxidized pad restoration',
      'Backlight filter & display connector corrosion check',
      'Full iPadOS stability & audio/Wi-Fi validation',
    ],
  },

  // iPhone Issues
  {
    id: 'iphone-screen',
    deviceTypes: ['iphone'],
    title: 'Cracked OLED / LCD Screen or Display Lines',
    serviceName: 'iPhone Screen Replacement',
    category: 'iPhone Display Repair',
    baseMin: 5500,
    baseMax: 19500,
    turnaround: 'Same Day (1 – 3 Hours)',
    checks: [
      'True Tone calibration & ambient light sensor transfer',
      'Face ID flood illuminator flex safety check',
      'Perimeter frame seal renewal & touch calibration',
    ],
  },
  {
    id: 'iphone-battery',
    deviceTypes: ['iphone'],
    title: 'Battery Health Below 80% / Battery Replacement',
    serviceName: 'iPhone Battery Replacement',
    category: 'iPhone Battery Service',
    baseMin: 3200,
    baseMax: 6800,
    turnaround: 'Same Day (1 – 2 Hours)',
    checks: [
      'Peak performance & internal cell impedance test',
      'Factory-grade stretch adhesive installation',
      'Overnight standby current drain verification',
    ],
  },
  {
    id: 'iphone-back-glass',
    deviceTypes: ['iphone'],
    title: 'Rear Back Glass or Camera Lens Replacement',
    serviceName: 'iPhone Back Glass & Camera Service',
    category: 'iPhone Housing Repair',
    baseMin: 3000,
    baseMax: 7500,
    turnaround: 'Same Day (2 – 4 Hours)',
    checks: [
      'MagSafe coil & wireless charging alignment check',
      'Optical sapphire camera lens dust-free sealing',
      'Ultrasonic glass clearance away from LiDAR & mic',
    ],
  },
  {
    id: 'iphone-charging-board',
    deviceTypes: ['iphone'],
    title: 'No Power / Charging Port / Liquid & Board Repair',
    serviceName: 'iPhone Logic Board & Charging Repair',
    category: 'iPhone Hardware Repair',
    baseMin: 3500,
    baseMax: 11000,
    turnaround: '1 – 2 Working Days',
    checks: [
      'Dual-layer sandwich logic board inspection under microscope',
      'Hydra/USB-C controller & VDD_MAIN short tracing',
      'Ultrasonic moisture remediation & data recovery focus',
    ],
  },
];

function roundToNearestHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function PriceEstimatorTool() {
  const { settings } = useApp();

  const sortedMacModels = useMemo(
    () =>
      MODEL_GROUPS.filter((m) => m.deviceType === 'macbook').sort(
        (a, b) => a.multiplier - b.multiplier
      ),
    []
  );

  const sortedMacIssues = useMemo(
    () =>
      ISSUE_ESTIMATES.filter((i) => i.deviceTypes.includes('macbook')).sort(
        (a, b) => a.baseMin - b.baseMin
      ),
    []
  );

  const [deviceType, setDeviceType] = useState<DeviceType>('macbook');
  const [selectedModelId, setSelectedModelId] = useState(() => sortedMacModels[0]?.id || 'air-intel');
  const [selectedIssueId, setSelectedIssueId] = useState(() => sortedMacIssues[0]?.id || 'mb-macos-software');

  const modelsForDevice = useMemo(
    () =>
      MODEL_GROUPS.filter((m) => m.deviceType === deviceType).sort(
        (a, b) => a.multiplier - b.multiplier
      ),
    [deviceType]
  );

  const issuesForDevice = useMemo(
    () =>
      ISSUE_ESTIMATES.filter((i) => i.deviceTypes.includes(deviceType)).sort(
        (a, b) => a.baseMin - b.baseMin
      ),
    [deviceType]
  );

  const handleDeviceSwitch = (nextType: DeviceType) => {
    setDeviceType(nextType);
    const nextModels = MODEL_GROUPS.filter((m) => m.deviceType === nextType).sort(
      (a, b) => a.multiplier - b.multiplier
    );
    const nextIssues = ISSUE_ESTIMATES.filter((i) => i.deviceTypes.includes(nextType)).sort(
      (a, b) => a.baseMin - b.baseMin
    );
    if (nextModels[0]) setSelectedModelId(nextModels[0].id);
    if (nextIssues[0]) setSelectedIssueId(nextIssues[0].id);
  };

  const selectedModel = useMemo(
    () => modelsForDevice.find((m) => m.id === selectedModelId) || modelsForDevice[0],
    [modelsForDevice, selectedModelId]
  );

  const selectedIssue = useMemo(
    () => issuesForDevice.find((i) => i.id === selectedIssueId) || issuesForDevice[0],
    [issuesForDevice, selectedIssueId]
  );

  const { minEstimate, maxEstimate } = useMemo(() => {
    const min = roundToNearestHundred(selectedIssue.baseMin * selectedModel.multiplier);
    const max = roundToNearestHundred(selectedIssue.baseMax * selectedModel.multiplier);
    return { minEstimate: min, maxEstimate: max };
  }, [selectedIssue, selectedModel]);

  const estimateLabel = `${formatInr(minEstimate)} – ${formatInr(maxEstimate)}`;

  const bookUrl = `/book?model=${encodeURIComponent(
    `${selectedModel.label} (${selectedModel.exampleModels})`
  )}&service=${encodeURIComponent(selectedIssue.serviceName)}&problem=${encodeURIComponent(
    `Estimated range viewed: ${estimateLabel} (${selectedIssue.title})`
  )}`;

  const waQuoteUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello Refix Pro, I used your Repair Price Estimator.\nModel: ${selectedModel.label} (${selectedModel.exampleModels})\nIssue: ${selectedIssue.title}\nShown Estimate Range: ${estimateLabel}\nPlease confirm exact pricing & parts availability.`
  );

  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white shadow-[0_12px_36px_-18px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-[#E5E5EA] bg-gradient-to-r from-[#F5F5F7] to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0066CC] tracking-tight">
            Starting Low to Full Repair · SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007
          </p>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] mt-1">
            MacBook &amp; Apple Repair Price Estimator
          </h3>
          <p className="text-xs sm:text-sm text-[#424245] mt-1">
            Select your MacBook model and service type to see an approximate cost range (arranged from minimum to higher repair tiers).
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] shrink-0">
          <Calculator className="w-4 h-4 text-[#0066CC]" />
          <span>Min → High Pricing</span>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <span className="block text-xs font-semibold text-[#1D1D1F] mb-2">
              1. Select Device Line
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DEVICE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = deviceType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleDeviceSwitch(tab.id)}
                    className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                        : 'bg-[#F5F5F7] text-[#424245] border-[#E5E5EA] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="estimator-model" className="block text-xs font-semibold text-[#1D1D1F] mb-2">
              2. Select {deviceType === 'macbook' ? 'MacBook Model' : deviceType === 'ipad' ? 'iPad Model' : 'iPhone Model'}
            </label>
            <select
              id="estimator-model"
              value={selectedModel.id}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            >
              {modelsForDevice.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.exampleModels})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="estimator-issue" className="block text-xs font-semibold text-[#1D1D1F] mb-2">
              3. Select Service Type (Minimum → Maximum Cost)
            </label>
            <select
              id="estimator-issue"
              value={selectedIssue.id}
              onChange={(e) => setSelectedIssueId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            >
              {issuesForDevice.map((iss) => {
                const startPrice = roundToNearestHundred(iss.baseMin * selectedModel.multiplier);
                const endPrice = roundToNearestHundred(iss.baseMax * selectedModel.multiplier);
                return (
                  <option key={iss.id} value={iss.id}>
                    {formatInr(startPrice)} – {formatInr(endPrice)} · {iss.serviceName} ({iss.title})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start gap-2.5 text-xs text-[#424245]">
            <Info className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Approximate price range shown immediately for estimation. Final repair cost and original/OEM part availability are confirmed after free physical bench inspection at Refix Pro, SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.
            </p>
          </div>
        </div>

        {/* Right Result Card */}
        <div className="lg:col-span-6 rounded-2xl bg-[#0A0A0C] text-white p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#2C2C2E] pb-5">
            <div>
              <p className="text-xs text-[#60A5FA] font-semibold">{selectedIssue.serviceName}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{selectedModel.label}</p>
              <p className="text-[11px] font-mono text-[#A1A1A6] mt-0.5">{selectedModel.exampleModels}</p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-[11px] text-[#A1A1A6]">Approximate Cost Range</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#60A5FA] mt-0.5">
                {estimateLabel}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-[#A1A1A6]">Typical Turnaround</span>
              <span className="font-semibold text-white text-right">{selectedIssue.turnaround}</span>
            </div>
            <div className="pt-2">
              <p className="text-xs font-semibold text-[#D2D2D7] mb-2">
                Included Bench Checks
              </p>
              <ul className="space-y-1.5">
                {selectedIssue.checks.map((chk) => (
                  <li key={chk} className="flex items-start gap-2 text-xs text-[#A1A1A6]">
                    <Check className="w-3.5 h-3.5 text-[#60A5FA] shrink-0 mt-0.5" />
                    <span>{chk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to={bookUrl}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Book This Repair
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={waQuoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              Exact Quote
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
