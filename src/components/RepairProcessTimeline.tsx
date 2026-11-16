import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  FileCheck2,
  MapPin,
  Microscope,
  ShieldCheck,
} from 'lucide-react';
import { STUDIO_EASE } from './MotionPrimitives';

interface RepairStep {
  number: string;
  title: string;
  shortTitle: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  highlights: string[];
  customerAction: string;
}

const REPAIR_STEPS: RepairStep[] = [
  {
    number: '01',
    title: 'Walk-In or Quick Online Booking',
    shortTitle: 'Intake & Logging',
    duration: '5–10 Mins',
    icon: ClipboardList,
    summary:
      'Bring your MacBook directly to SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 or submit your repair request online in 30 seconds.',
    highlights: [
      'Instant RP-... Enquiry ID assigned for live status tracking',
      'Physical cosmetic & port check logged right in front of you',
      'Your customer dashboard saves every update linked to your account',
    ],
    customerAction: 'Share model number (e.g. A2337, A2442) and primary symptom.',
  },
  {
    number: '02',
    title: 'Microscope & Power Rail Diagnostics',
    shortTitle: 'Diagnostics',
    duration: '30–90 Mins',
    icon: Microscope,
    summary:
      'Technicians inspect USB-C current negotiation, internal battery rails, display connectors, and logic board lines under Leica stereo optics.',
    highlights: [
      'USB-C ammeter traces 5V to 20V power delivery transitions',
      'Board thermal imaging and short-circuit isolation',
      'Ultrasonic inspection for hidden liquid oxidation or corrosion',
    ],
    customerAction: 'We never proceed with invasive repair work before diagnosing the exact fault.',
  },
  {
    number: '03',
    title: 'Transparent Quote & Part Confirmation',
    shortTitle: 'Quote Approval',
    duration: 'Before Any Work',
    icon: FileCheck2,
    summary:
      'Once inspected, we share clear fault findings, minimum-to-exact estimate, expected turnaround time, and component availability.',
    highlights: [
      'Written repair estimate posted directly to your Customer Dashboard',
      'Option to approve or decline without surprise hidden charges',
      'Clear component grade and service warranty terms explained upfront',
    ],
    customerAction: 'Approve the quote via call, WhatsApp, or your Customer Dashboard.',
  },
  {
    number: '04',
    title: 'Chip-Level Repair or Component Service',
    shortTitle: 'Precision Repair',
    duration: 'Same Day – 3 Days',
    icon: Cpu,
    summary:
      'Certified ESD-safe micro-soldering, Retina display fitment, battery swap, or ultrasonic spill recovery carried out on our clean bench.',
    highlights: [
      'Original motherboard & customer SSD data preserved wherever possible',
      'Precision adhesive removal for swollen or aged MacBook batteries',
      'Calibrated True Tone, hinges, backlight lines, and USB-C controllers',
    ],
    customerAction: 'Track every stage live from Inspection to In Repair online.',
  },
  {
    number: '05',
    title: 'Multi-Point QA & Thermal Stress Testing',
    shortTitle: 'QA Stress Test',
    duration: '60 Mins',
    icon: ShieldCheck,
    summary:
      'Before marking your MacBook Ready for Pickup, every subsystem runs through charge cycling, thermal load, audio, Wi-Fi, and display tests.',
    highlights: [
      'Dual-port USB-C charging & sleep-wake idle drain test',
      'Keyboard switch actuation, Force Touch trackpad & webcam check',
      'CPU/GPU thermal curve validation after fan & paste servicing',
    ],
    customerAction: 'Desk updates your status to Ready for Pickup with final notes.',
  },
  {
    number: '06',
    title: 'Final Inspection & Pickup at Sector 14 Desk',
    shortTitle: 'Ready Pickup',
    duration: 'At Collection',
    icon: MapPin,
    summary:
      'Collect your tested MacBook from SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 and verify everything in person with the technician.',
    highlights: [
      'Side-by-side boot, display brightness, keyboard, and charging verification',
      'Invoice & service warranty period recorded clearly on handover',
      'Direct post-service support if you have any macOS or setup question',
    ],
    customerAction: 'Verify your device on the counter before leaving.',
  },
];

export function RepairProcessTimeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = REPAIR_STEPS[activeIndex];
  const CurrentIcon = current.icon;
  const progressPercent = ((activeIndex + 1) / REPAIR_STEPS.length) * 100;

  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white shadow-[0_14px_40px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header & Progress Bar */}
      <div className="p-6 sm:p-8 border-b border-[#E5E5EA] bg-gradient-to-r from-[#F5F5F7] via-white to-[#F5F5F7]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0066CC]">Interactive Repair Journey</p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] mt-1">
              From Diagnostics to Final Delivery — Step by Step
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : REPAIR_STEPS.length - 1))}
              aria-label="Previous repair step"
              className="w-10 h-10 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-mono font-semibold tabular-nums">
              Step {activeIndex + 1} / {REPAIR_STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev < REPAIR_STEPS.length - 1 ? prev + 1 : 0))}
              aria-label="Next repair step"
              className="w-10 h-10 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Continuous Progress Track */}
        <div className="mt-6 h-1.5 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
          <motion.div
            className="h-full bg-[#0066CC]"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: STUDIO_EASE }}
          />
        </div>

        {/* Interactive Step Nodes */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {REPAIR_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                  isActive
                    ? 'bg-[#0066CC] text-white border-[#0066CC] shadow-[0_8px_20px_-8px_rgba(0,102,204,0.55)]'
                    : isPast
                      ? 'bg-[#0066CC]/8 text-[#1D1D1F] border-[#0066CC]/30 hover:border-[#0066CC]'
                      : 'bg-white text-[#424245] border-[#E5E5EA] hover:border-[#0066CC]/50 hover:text-[#1D1D1F]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[11px] font-mono font-bold tabular-nums ${
                      isActive ? 'text-white/90' : 'text-[#0066CC]'
                    }`}
                  >
                    {step.number}.
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#0066CC]'}`} />
                </div>
                <p className="text-xs font-bold leading-snug">{step.shortTitle}</p>
                <p
                  className={`text-[10px] mt-0.5 tabular-nums ${
                    isActive ? 'text-white/80' : 'text-[#6E6E73]'
                  }`}
                >
                  {step.duration}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Detail Card */}
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: STUDIO_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0066CC]/10 border border-[#0066CC]/20 flex items-center justify-center">
                  <CurrentIcon className="w-5 h-5 text-[#0066CC]" />
                </div>
                <div>
                  <p className="text-xs font-mono font-semibold text-[#0066CC] tabular-nums">
                    Stage {current.number} · Typical Time: {current.duration}
                  </p>
                  <h4 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">
                    {current.title}
                  </h4>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#424245] leading-relaxed">
                {current.summary}
              </p>

              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs sm:text-sm text-[#1D1D1F]">
                <span className="font-semibold text-[#0066CC]">What Happens Next: </span>
                {current.customerAction}
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0A0A0C] text-white space-y-4">
              <p className="text-xs font-semibold text-[#60A5FA]">
                Stage {current.number} Bench Checklist
              </p>
              <ul className="space-y-3">
                {current.highlights.map((hl) => (
                  <li key={hl} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#D2D2D7]">
                    <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{hl}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-[#2C2C2E] flex flex-wrap gap-2.5">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Start Step 01: Book Repair
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2C2C2E] hover:bg-[#1D1D1F] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Open My Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
