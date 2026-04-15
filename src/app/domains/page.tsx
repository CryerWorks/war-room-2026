import type { Domain } from "@/types";

// Placeholder until Supabase is wired up
const DOMAINS: Domain[] = [
  {
    id: "1",
    name: "Linguistic",
    slug: "linguistic",
    description: "Language learning and communication goals",
    color: "#6366f1",
    created_at: "",
  },
  {
    id: "2",
    name: "Skill",
    slug: "skill",
    description: "Technical and programming skill development",
    color: "#f59e0b",
    created_at: "",
  },
  {
    id: "3",
    name: "Physical",
    slug: "physical",
    description: "Physical fitness and health goals",
    color: "#10b981",
    created_at: "",
  },
];

export default function DomainsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Domains
        </h2>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Your three areas of development for 2026.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DOMAINS.map((domain) => (
          <div
            key={domain.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {domain.name}
              </h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {domain.description}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Goals and modules coming soon
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
