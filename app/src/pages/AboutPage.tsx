import { Activity, Database, Globe, HardDrive, Server } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { primaryButtonClass } from '../components/ui/styles'

/** AWS services behind PetCloud, matching the deployment diagram in aws/README.md. */
const ARCHITECTURE = [
  { icon: Globe, name: 'Amazon S3 + CloudFront', role: 'Serves this web application over HTTPS.' },
  { icon: Server, name: 'Amazon EC2', role: 'Runs the FastAPI REST API with the adoption business logic.' },
  { icon: Database, name: 'Amazon RDS (PostgreSQL)', role: 'Stores users, organizations, pets, and adoption requests.' },
  { icon: HardDrive, name: 'Amazon S3', role: 'Stores pet photos, uploaded directly from the browser.' },
  { icon: Activity, name: 'Amazon CloudWatch', role: 'Collects logs and metrics to monitor the platform.' },
]

const TEAM = ['Gabriel de Freitas', 'Lucas Fischer', 'Luiz Dias', 'Vinicius Jaeger']

export function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About Us' }]} />

      <div className="mx-auto max-w-4xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h1 className="text-3xl font-semibold text-brand-900">About PetCloud</h1>
          <p className="mt-4 leading-relaxed text-gray-700">
            Finding a pet to adopt often means searching scattered social media posts, outdated listings, and messages
            that never get an answer. Shelters, in turn, track requests in spreadsheets and chat apps. PetCloud
            centralizes this journey: adopters find pets with up-to-date profiles and follow their requests, while
            organizations manage their animals and review requests in one place.
          </p>
          <p className="mt-4 leading-relaxed text-gray-700">
            The project focuses on the core adoption workflow, keeping the scope small so it can be delivered reliably.
          </p>
        </section>

        <section aria-labelledby="architecture-title">
          <h2 id="architecture-title" className="text-xl font-semibold text-brand-900">
            Cloud architecture
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {ARCHITECTURE.map(({ icon: Icon, name, role }) => (
              <li key={name} className="flex gap-4 rounded-xl border border-gray-200 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50">
                  <Icon className="size-5 text-brand-600" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-gray-900">{name}</p>
                  <p className="mt-1 text-sm text-gray-600">{role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="team-title">
          <h2 id="team-title" className="text-xl font-semibold text-brand-900">
            The team
          </h2>
          <p className="mt-3 text-gray-700">
            PetCloud is an academic project by Group H for Special Topics in Computing: Trending Information
            Technologies, at UNISINOS (2026/2).
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {TEAM.map((member) => (
              <li key={member} className="rounded-full bg-brand-50 px-4 py-1.5 text-sm text-brand-800">
                {member}
              </li>
            ))}
          </ul>
        </section>

        <Link to="/adopt" className={primaryButtonClass}>
          Meet the pets
        </Link>
      </div>
    </>
  )
}
