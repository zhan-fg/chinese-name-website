"use client";

import { SourceCategory } from "@/lib/types";
import { motion } from "framer-motion";

const sources: {
  id: SourceCategory;
  icon: string;
  label: string;
  description: string;
}[] = [
  {
    id: "poetry",
    icon: "\uD83D\uDCDC",
    label: "Classical Poetry",
    description:
      "Names from the verses of China's greatest poets. Think Shakespeare, but about moonlight and mountains.",
  },
  {
    id: "elements",
    icon: "\u262F\uFE0F",
    label: "Five Elements",
    description:
      "Names from an ancient personality system — like the Enneagram, but 2,000 years older. Discover your elemental archetype.",
  },
  {
    id: "nature",
    icon: "\uD83C\uDF0F",
    label: "Stars & Earth",
    description:
      "Names from oceans, mountains, and constellations. For people who feel most alive in the wild.",
  },
  {
    id: "mythology",
    icon: "\uD83D\uDC09",
    label: "Myths & Legends",
    description:
      "Names from the stories of dragons, phoenixes, and immortal heroes. Like Greek mythology — from the East.",
  },
  {
    id: "history",
    icon: "\uD83C\uDFDB\uFE0F",
    label: "Living History",
    description:
      "Names worn by real generals, poets, and visionaries. Like being named after a Roman emperor — but Chinese.",
  },
];

interface Props {
  selected: SourceCategory | null;
  onSelect: (category: SourceCategory) => void;
}

export default function SourceSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-light text-text-primary mb-3">
          Where should your name come from?
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
          Pick a source. Every name we generate is rooted in a real classical
          text — no AI randomness, no made-up combinations.
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((source, i) => {
          const isSelected = selected === source.id;
          return (
            <motion.button
              key={source.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              onClick={() => onSelect(source.id)}
              className={`w-full text-left p-4 rounded-card border-2 transition-all duration-200 ${
                isSelected
                  ? "border-deep-blue bg-[#EEF4F8] shadow-sm"
                  : "border-card-border bg-surface hover:border-mist"
              }`}
              aria-label={`Select ${source.label}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">
                  {source.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">
                      {source.label}
                    </span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-deep-blue text-xs"
                      >
                        &#10003;
                      </motion.span>
                    )}
                  </div>
                  <p className="text-text-secondary text-xs leading-relaxed mt-1">
                    {source.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <p className="text-xs text-center text-text-secondary">
            Great choice. Tap &quot;Continue&quot; to personalize or skip ahead.
          </p>
        </motion.div>
      )}
    </div>
  );
}
