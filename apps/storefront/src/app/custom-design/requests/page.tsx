'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomRequests, isAuthenticated, CustomRequest } from '@/lib/api';

export default function CustomRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login?redirect=/custom-design/requests');
      return;
    }

    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getCustomRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load custom requests:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
        <div className="text-center text-[#6a636b]">
          <div className="mx-auto mb-3 h-3 w-3 animate-pulse rounded-full bg-[#8a5d38]" />
          <span className="font-serif">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="border-b border-[#ded8d0] bg-white px-4 py-12 sm:px-6 lg:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
            Wolhomes Bespoke
          </p>
          <h1 className="mb-3 font-serif text-4xl font-light text-[#302b35] sm:text-5xl">
            My Custom Design Requests
          </h1>
          <p className="text-base text-[#6a636b] sm:text-lg">
            Track your bespoke projects
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/account"
            className="text-sm text-[#6a636b] underline underline-offset-4 transition hover:text-[#8a5d38]"
          >
            Back to Account
          </Link>

          <Link
            href="/custom-design"
            className="inline-flex items-center justify-center rounded-md bg-[#bf4e48] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#a9443e]"
          >
            + New Request
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="space-y-5">
            {requests.map(request => (
              <Link
                key={request.id}
                href={`/custom-design/requests/${request.id}`}
                className="group block rounded-lg border border-[#ded8d0] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#bf4e48]/50 hover:shadow-md sm:p-7"
              >
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-2xl text-[#302b35] transition group-hover:text-[#8a5d38]">
                        {request.title}
                      </h3>

                      <span
                        className={`rounded-sm px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          request.status === 'Completed'
                            ? 'bg-[#8a5d38]/10 text-[#8a5d38]'
                            : request.status === 'In Progress'
                              ? 'bg-[#bf4e48]/10 text-[#bf4e48]'
                              : request.status === 'Quoted'
                                ? 'bg-[#8a5d38]/10 text-[#8a5d38]'
                                : 'bg-[#f0ece7] text-[#6a636b]'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="mb-1 text-sm text-[#6a636b]">
                      Request #{request.requestNumber}
                    </p>

                    {request.productCategory && (
                      <p className="text-sm text-[#8b8389]">
                        {request.productCategory}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm text-[#8b8389]">
                      Created {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>

                    {request.estimatedBudget && (
                      <p className="mt-1 font-serif text-base text-[#302b35]">
                        ${request.estimatedBudget.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mb-5 max-w-4xl line-clamp-2 text-[15px] leading-7 text-[#6a636b]">
                  {request.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#eee9e3] pt-4 text-sm text-[#8b8389]">
                  {request.desiredDimensions && (
                    <span>Size: {request.desiredDimensions}</span>
                  )}
                  {request.quantity > 1 && (
                    <span>Qty: {request.quantity}</span>
                  )}
                  <span className="ml-auto hidden text-[#8a5d38] transition group-hover:block">
                    View Request ?
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[#ded8d0] bg-white px-6 py-16 text-center shadow-sm sm:px-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5d38]">
              Bespoke Studio
            </p>
            <h2 className="mb-4 font-serif text-3xl font-light text-[#302b35] sm:text-4xl">
              No Custom Requests Yet
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base leading-7 text-[#6a636b]">
              Start your bespoke design journey. Our master artisans are ready
              to create something extraordinary for you.
            </p>
            <Link
              href="/custom-design"
              className="inline-block rounded-md bg-[#302b35] px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#211e24]"
            >
              Create Custom Design
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
