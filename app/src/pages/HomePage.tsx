import { ClipboardCheck, HeartHandshake, HousePlus, MessageCircleHeart, PawPrint, Search, Stethoscope, UserPlus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import homeBulldog from '../assets/home-bulldog.png'
import { outlineButtonClass, primaryButtonClass } from '../components/ui/styles'

const STEPS = [
  { icon: UserPlus, text: 'Create your free profile in a couple of minutes.' },
  { icon: HousePlus, text: 'Tell the shelter about your home and routine so they know it is the right fit.' },
  { icon: Search, text: 'Find your pet and send your adoption request!' },
]

const BENEFITS = [
  {
    icon: HeartHandshake,
    title: 'Emotional bond',
    text: 'The relationship between people and pets is built on trust, routine, and unconditional affection.',
  },
  {
    icon: MessageCircleHeart,
    title: 'Communication',
    text: 'Pets communicate through body language and sounds; living together teaches us to listen without words.',
  },
  {
    icon: Users,
    title: 'Children and pets',
    text: 'Growing up with animals helps children develop empathy, responsibility, and emotional security.',
  },
  {
    icon: Stethoscope,
    title: 'Health',
    text: 'Studies associate living with pets with more physical activity and lower stress levels.',
  },
]

const FAQ = {
  adopters: [
    {
      question: 'How much does it cost to adopt?',
      answer: 'PetCloud is free to use. Any adoption terms are agreed directly with the organization that cares for the pet.',
    },
    {
      question: 'How do I know the status of my request?',
      answer: 'Every request appears in "My requests" with its current status and any note from the organization.',
    },
    {
      question: 'Can I request more than one pet?',
      answer: 'Yes. You can have one open request per pet, and each organization reviews its own requests.',
    },
  ],
  organizations: [
    {
      question: 'Who can publish pets?',
      answer: 'Shelters, NGOs, and independent rescuers with an organization account. Contact the PetCloud team to get one.',
    },
    {
      question: 'How do I review requests?',
      answer: 'The organization portal lists every request with the adopter profile and answers. Approve or reject with one click.',
    },
    {
      question: 'What happens when I approve a request?',
      answer: 'The pet is marked as pending and leaves the public catalog until you mark it as adopted or available again.',
    },
  ],
}

/** Public landing page, based on the "Landing page" design reference. */
export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-t-8 border-brand-400">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <h1 className="text-4xl leading-tight font-medium text-brand-900 sm:text-5xl">
              Give a New Life to
              <br />
              <span className="font-semibold text-brand-600">a Pet with PetCloud</span>
            </h1>
            <p className="mt-6 max-w-lg text-gray-700">
              Adoption and rehoming give animals a fresh start. PetCloud brings shelters, NGOs, and independent rescuers
              together in one place, so you can find your new companion and follow your request from start to finish.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/adopt" className={primaryButtonClass}>
                Adopt Now
              </Link>
              <Link to="/organization" className={outlineButtonClass}>
                Rehome Now
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-300 to-brand-600" />
            <div className="absolute inset-4 overflow-hidden rounded-full border-8 border-white/40">
              <img src={homeBulldog} alt="" className="size-full object-cover" />
            </div>
            <div className="absolute -top-2 right-6 size-10 rounded-full bg-brand-300" />
            <div className="absolute bottom-8 -left-4 size-6 rounded-full bg-brand-200" />
            <div className="absolute -bottom-2 left-16 size-3 rounded-full bg-brand-400" />
          </div>
        </div>
      </section>

      {/* 3 easy steps */}
      <section className="bg-gray-50 py-20" aria-labelledby="steps-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="steps-title" className="text-center text-2xl font-medium text-gray-900 sm:text-3xl">
            Adopt or Rehome a pet in just
            <span className="mt-1 block text-xl text-brand-600">3 Easy Steps</span>
          </h2>
          <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            {/* Dashed connector between the steps (decorative, desktop only). */}
            <svg className="pointer-events-none absolute top-1/2 left-0 hidden h-16 w-full -translate-y-1/2 md:block" preserveAspectRatio="none" viewBox="0 0 300 40" aria-hidden>
              <path d="M70 20 C 100 0, 120 40, 150 20 S 200 0, 230 20" fill="none" stroke="var(--color-brand-400)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            </svg>
            {STEPS.map(({ icon: Icon, text }, index) => (
              <li key={text} className="relative flex flex-col items-center rounded-xl border border-gray-200 bg-white px-6 pt-12 pb-8 text-center shadow-sm">
                <span className="absolute -top-5 grid size-10 place-items-center rounded-full border border-gray-200 bg-white font-semibold text-brand-900">
                  {index + 1}
                </span>
                <Icon className="size-12 text-brand-600" strokeWidth={1.5} aria-hidden />
                <p className="mt-4 text-sm text-gray-700">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Peaceful coexistence */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8" aria-labelledby="coexistence-title">
        <div className="text-center lg:text-left">
          <h2 id="coexistence-title" className="text-2xl font-medium text-gray-900 sm:text-3xl">
            Peaceful Coexistence
            <span className="mt-2 block text-brand-600">Humans &amp; Animals</span>
          </h2>
          <p className="mt-4 text-gray-700">
            Adopting is more than giving a pet a home: it starts a relationship that is good for everyone involved.
          </p>
          <PawPrint className="mx-auto mt-8 size-24 text-brand-100 lg:mx-0" aria-hidden />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="flex items-center gap-3 font-medium text-brand-900">
                <span className="grid size-9 place-items-center rounded-full bg-brand-50">
                  <Icon className="size-5 text-brand-600" aria-hidden />
                </span>
                {title}
              </h3>
              <p className="mt-3 text-sm text-gray-700">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20" aria-labelledby="faq-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 id="faq-title" className="text-center text-2xl font-medium text-gray-900 sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {(
              [
                ['FAQ for Pet Adopters', FAQ.adopters],
                ['FAQ for Organizations', FAQ.organizations],
              ] as const
            ).map(([title, items]) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-medium text-brand-600">
                  <ClipboardCheck className="size-6" aria-hidden />
                  {title}
                </h3>
                <div className="mt-4 divide-y divide-gray-100">
                  {items.map((item) => (
                    <details key={item.question} className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <span className="text-brand-600 transition-transform group-open:rotate-45" aria-hidden>
                          +
                        </span>
                      </summary>
                      <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
