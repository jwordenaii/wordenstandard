import { ShieldCheck, Droplets, Car, Zap } from 'lucide-react'

const services = [
  {
    title: 'Asphalt Paving & Resurfacing',
    description:
      'Learn when your lot can be resurfaced — and when full replacement is the smarter investment.',
    icon: <Zap className="h-12 w-12 text-amber-400" />,
    link: '/commercial#resurfacing-vs-replacement',
  },
  {
    title: 'Pavement Preservation: Sealcoating & Crack Sealing',
    description:
      'Discover why “cheap” sealcoating can actually cost more long-term.',
    icon: <ShieldCheck className="h-12 w-12 text-amber-400" />,
    link: '/commercial#preservation-economics',
  },
  {
    title: 'Drainage & Catch Basin Repairs',
    description: 'Understand how water destroys asphalt — and how to stop it.',
    icon: <Droplets className="h-12 w-12 text-amber-400" />,
    link: '/commercial#drainage-solutions',
  },
  {
    title: 'ADA Compliance & Pavement Marking',
    description:
      'Ensure your property stays safe and compliant with federal standards.',
    icon: <Car className="h-12 w-12 text-amber-400" />,
    link: '/commercial#ada-compliance',
  },
]

export default function CommercialServicesHighlights() {
  return (
    <div className="bg-slate-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-amber-400">
            Commercial & Industrial Expertise
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Build & Maintain Pavement That Lasts Decades
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            We protect your investment by engineering pavement solutions that
            address the root cause of failure, from subsurface water intrusion
            to traffic load miscalculations.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {services.map(service => (
              <div key={service.title} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  {service.icon}
                  {service.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-300">
                  <p className="flex-auto">{service.description}</p>
                  <p className="mt-6">
                    <a
                      href={service.link}
                      className="text-sm font-semibold leading-6 text-amber-400 hover:text-amber-300"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
