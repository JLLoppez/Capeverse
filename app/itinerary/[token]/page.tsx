import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type Stop = {
  name: string;
  region: string;
  reason?: string;
};

type DayResult = {
  day: number;
  title: string;
  stops: Stop[];
};

type ItineraryResult = {
  summary: string;
  recommendedTourType: string;
  estimatedPriceBand: string;
  days: DayResult[];
  warnings?: string[];
  droppedAttractions?: string[];
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedItineraryPage({
  params,
}: PageProps) {
  const { token } = await params;

  const saved = await prisma.savedItinerary.findUnique({
    where: { token },
  });

  if (!saved) {
    notFound();
  }

  if (saved.expiresAt < new Date()) {
    return (
      <section className="section">
        <div
          className="narrow"
          style={{ textAlign: 'center', paddingTop: '4rem' }}
        >
          <div
            className="section-eyebrow"
            style={{ justifyContent: 'center' }}
          >
            Expired
          </div>

          <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            This itinerary link has expired
          </h1>

          <p
            className="lead"
            style={{ marginBottom: '2rem' }}
          >
            Itinerary links are valid for 90 days. Head back to the planner to
            generate a new one.
          </p>

          <Link
            href="/plan-trip"
            className="btn btn-primary"
          >
            Build a new itinerary
          </Link>
        </div>
      </section>
    );
  }

  const result = saved.itineraryJson as ItineraryResult;
  const interests = saved.interests as string[];

  return (
    <>
      <section
        className="itinerary-token-hero"
        style={{
          background: 'var(--ink)',
          padding: '4.5rem 0 3.5rem',
        }}
      >
        <div className="container narrow">
          <div
            className="section-eyebrow"
            style={{
              color: 'var(--sienna-lt)',
              marginBottom: '1rem',
            }}
          >
            Saved itinerary
          </div>

          <h1
            style={{
              color: 'var(--salt)',
              marginBottom: '1.25rem',
            }}
          >
            Your Cape Town trip plan
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            {[
              `${saved.days} day${saved.days > 1 ? 's' : ''}`,
              saved.groupType,
              saved.budget,
              saved.pace,
              ...interests,
            ].map((chip) => (
              <span
                key={chip}
                className="trust-chip"
              >
                {chip}
              </span>
            ))}
          </div>

          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              maxWidth: 560,
              fontWeight: 300,
              lineHeight: 1.8,
            }}
          >
            {result.summary}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <div
            className="pill-row"
            style={{ marginBottom: '2rem' }}
          >
            <span className="pill">
              {result.recommendedTourType}
            </span>
            <span className="pill">
              {result.estimatedPriceBand}
            </span>
          </div>

          {result.warnings?.length ? (
            <div
              className="notice warn"
              style={{ marginBottom: '1.5rem' }}
            >
              {result.warnings.map((warning, index) => (
                <p
                  key={index}
                  style={{
                    margin: index > 0 ? '0.4rem 0 0' : 0,
                    fontSize: '0.84rem',
                  }}
                >
                  ⚠ {warning}
                </p>
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {result.days.map((day) => (
              <div
                key={day.day}
                className="panel"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      color: 'var(--sienna)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Day {day.day}
                  </span>

                  <h3 style={{ margin: 0 }}>
                    {day.title}
                  </h3>
                </div>

                <ul
                  style={{
                    display: 'grid',
                    gap: '0.55rem',
                    paddingLeft: 0,
                    listStyle: 'none',
                  }}
                >
                  {day.stops.map((stop) => (
                    <li
                      key={`${day.day}-${stop.name}`}
                      style={{
                        padding: '0.72rem 0.9rem',
                        background: 'var(--salt)',
                        borderRadius: 'var(--r)',
                        border:
                          '1px solid rgba(13,31,45,0.07)',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                        }}
                      >
                        {stop.name}
                      </span>

                      <span
                        className="muted"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {' '}
                        · {stop.region}
                      </span>

                      {stop.reason && (
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'rgba(13,31,45,0.45)',
                            margin: '0.2rem 0 0',
                            fontWeight: 300,
                          }}
                        >
                          {stop.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {result.droppedAttractions?.length ? (
            <div
              className="notice"
              style={{ marginBottom: '1.5rem' }}
            >
              <strong>Couldn't fit:</strong>{' '}
              {result.droppedAttractions.join(', ')}.
              A consultant can extend the trip or adjust the pace.
            </div>
          ) : null}

          <div
            className="cta-block-pad"
            style={{
              background: 'var(--ink)',
              borderRadius: 'var(--r-xl)',
              padding: '2.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <h3
                style={{
                  color: 'var(--salt)',
                  marginBottom: '0.4rem',
                }}
              >
                Ready to make this happen?
              </h3>

              <p
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0,
                  fontSize: '0.86rem',
                  fontWeight: 300,
                }}
              >
                Send this plan to a consultant — we'll refine the timing and get
                it booked.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <a
                href={`https://wa.me/${
                  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
                }?text=${encodeURIComponent(
                  "Hi! I've planned a Cape Town trip and would love some help finalising it."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wa"
              >
                💬 WhatsApp
              </a>

              <Link
                href={`/enquiry?itinerary=${token}`}
                className="btn btn-primary"
              >
                Enquire now →
              </Link>
            </div>
          </div>

          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--mist)',
              marginTop: '1.5rem',
              textAlign: 'center',
            }}
          >
            Link valid until{' '}
            {new Date(saved.expiresAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        </div>
      </section>
    </>
  );
}
