"use client";

import { useState, useEffect, useMemo, Component, ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Error Boundary for catching uncaught errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    toast.error("An unexpected error occurred. Please refresh the page.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
            <p className="text-gray-600 mb-6">Something went wrong. Please refresh the page and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// API call with timeout protection
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe not loaded. Please refresh the page.');
      return;
    }
    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required'
      } as any);

      if (error) {
        toast.error(`Payment failed: ${error.message}`);
        console.error('Payment error', error);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        toast.error('Payment did not complete. Please try again.');
      }
    } catch (err: any) {
      toast.error(`Payment error: ${err?.message || 'Unknown error'}`);
      console.error('Payment submission error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button type="submit" disabled={!stripe || loading} className="w-full bg-blue-600 text-white py-2 rounded">
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}

interface BookingResult {
  success: boolean;
  beat_price: number;
  savings_percent: number;
  curated_package: {
    room: {
      price: number;
      ota: string;
      url: string;
    };
    tours: Array<{
      name: string;
      type: string;
      price: number;
      duration: string;
    }>;
    dinner: {
      name: string;
      price: number;
    };
    total: number;
    affiliate_links: Array<{
      provider: string;
      url: string;
      commission: number;
    }>;
  };
  recommendations: string[];
  error?: string;
}

// Retry helper function  
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

export default function BookingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  
  // Memoize stripePromise to prevent reloading on every render
  const stripePromise = useMemo(() => 
    (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      : null,
    []
  );
  const [formData, setFormData] = useState({
    roomType: "overwater room",
    checkInDate: "",
    checkOutDate: "",
    location: "Belize",
    groupSize: 2,
    tourBudget: 500,
    interests: ["snorkeling", "fishing"],
    activityLevel: "medium" as const,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        interests: checked
          ? [...prev.interests, value]
          : prev.interests.filter((i) => i !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "number"
            ? parseInt(value)
            : name === "activityLevel"
              ? value
              : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.checkInDate || !formData.checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Running agents... Price Scout & Experience Curator");

    try {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Book Flow] Starting booking with data:", {
          roomType: formData.roomType,
          guests: formData.groupSize,
          dates: `${formData.checkInDate} to ${formData.checkOutDate}`,
        });
      }

      const data: BookingResult = await fetchWithTimeout<BookingResult>(
        "/api/book-flow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
        45000 // Extended timeout for agent processing (45s)
      );

      if (!data.success) {
        throw new Error(data.error || "Booking failed");
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("[Book Flow] Success:", { beatPrice: data.beat_price, total: data.curated_package.total });
      }
      setResult(data);

      // If server returned a client_secret from Stripe, open payment modal
      if ((data as any).client_secret) {
        setPaymentOptions({ clientSecret: (data as any).client_secret });
        setShowPayment(true);
      }
      toast.dismiss(loadingToast);
      toast.success("Booking processed successfully!");
    } catch (error) {
      console.error("[Book Flow] Error:", error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Create payment intent and show payment element
  const handlePay = async () => {
    if (!result) return;
    try {
      setIsLoading(true);
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Payment] Creating payment intent for amount:", result.curated_package.total);
      }

      const data = await fetchWithTimeout<any>(
        '/api/stripe/create-payment-intent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: result.curated_package.total, 
            currency: 'usd', 
            metadata: { booking: 'lina-point' } 
          }),
        },
        10000 // Payment intent creation should be fast
      );

      if (data.error) {
        throw new Error(data.error);
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("[Payment] Payment intent created:", data.client_secret);
      }
      setPaymentOptions({ clientSecret: data.client_secret });
      setShowPayment(true);
    } catch (err) {
      console.error("[Payment] Error:", err);
      toast.error(err instanceof Error ? err.message : 'Payment setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {formData.location} Booking Assistant
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              AI-powered price comparison & tour curation powered by LangGraph & Grok-4
            </p>

          {!result ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Search Rooms & Tours
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Room Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <input
                      type="text"
                      name="roomType"
                      value={formData.roomType}
                      onChange={handleInputChange}
                      placeholder="e.g., overwater room, beach suite"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Belize">Belize</option>
                      <option value="Costa Rica">Costa Rica</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Caribbean">Caribbean Islands</option>
                    </select>
                  </div>

                  {/* Check-in Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      name="checkInDate"
                      value={formData.checkInDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Check-out Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      name="checkOutDate"
                      value={formData.checkOutDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Group Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Size
                    </label>
                    <input
                      type="number"
                      name="groupSize"
                      value={formData.groupSize}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Tour Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tour Budget ($)
                    </label>
                    <input
                      type="number"
                      name="tourBudget"
                      value={formData.tourBudget}
                      onChange={handleInputChange}
                      min="100"
                      step="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Level
                    </label>
                    <select
                      name="activityLevel"
                      value={formData.activityLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low (Relaxation)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Adventure)</option>
                    </select>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tour Interests
                    </label>
                    <div className="space-y-2">
                      {["snorkeling", "fishing", "mainland", "dining"].map(
                        (interest) => (
                          <div key={interest} className="flex items-center">
                            <input
                              type="checkbox"
                              id={interest}
                              name={interest}
                              value={interest}
                              checked={formData.interests.includes(interest)}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={interest}
                              className="ml-3 text-sm text-gray-700 capitalize"
                            >
                              {interest}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isLoading ? "Processing... (Running Agents)" : "Search & Curate"}
                  </button>
                </form>
              </div>

              {/* Info Panel */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  How It Works
                </h2>

                <div className="space-y-6">
                  <div className="border-l-4 border-blue-600 pl-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      1. Price Scout Agent
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      Scans Agoda, Expedia & Booking.com across up to 3 iterations to find the
                      best deal, then beats it by 3%.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      2. Experience Curator Agent
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      Customizes fishing, snorkeling & mainland tours based on your preferences
                      and generates affiliate links.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-600 pl-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      3. Smart Recommendations
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      LangGraph orchestrates both agents, compares prices recursively, and
                      packages everything with affiliate commissions.
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mt-8">
                    <p className="text-sm text-gray-700">
                      <strong>Example Query:</strong> "Find an overwater room for 2, snorkeling
                      tour for family, with $500 tour budget"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Results Display */
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Your Perfect {formData.location} Package
                </h2>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  ← New Search
                </button>
              </div>

              {/* Price Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-l-4 border-red-600">
                  <p className="text-gray-600 text-sm font-semibold">Original Price</p>
                  <p className="text-3xl font-bold text-red-600">
                    ${result.curated_package.room.price}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">{result.curated_package.room.ota}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-600">
                  <p className="text-gray-600 text-sm font-semibold">Beat Price</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${result.beat_price}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Save {result.savings_percent}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-600">
                  <p className="text-gray-600 text-sm font-semibold">Total Package</p>
                  <p className="text-3xl font-bold text-purple-600">
                    ${result.curated_package.total}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">All-inclusive</p>
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Room */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Room Booking</h3>
                  <p className="text-gray-700 mb-2">
                    <strong>Type:</strong> {formData.roomType}
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Price:</strong> ${result.curated_package.room.price}
                  </p>
                  <p className="text-gray-700 mb-4">
                    <strong>OTA:</strong> {result.curated_package.room.ota}
                  </p>
                  <a
                    href={result.curated_package.room.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Book Direct & Save {result.savings_percent}%
                  </a>
                  <button
                    onClick={handlePay}
                    disabled={isLoading || !stripePromise}
                    className="ml-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    {isLoading ? 'Setting up payment...' : 'Pay Securely'}
                  </button>
                </div>

                {/* Tours */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Curated Experiences</h3>
                  <div className="space-y-3">
                    {result.curated_package.tours.map((tour, idx) => (
                      <div key={idx} className="bg-gray-50 rounded p-3">
                        <p className="font-semibold text-gray-900">{tour.name}</p>
                        <p className="text-sm text-gray-600">
                          {tour.duration} • ${tour.price}
                        </p>
                      </div>
                    ))}
                    <div className="bg-orange-50 rounded p-3">
                      <p className="font-semibold text-gray-900">
                        {result.curated_package.dinner.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${result.curated_package.dinner.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affiliate Links */}
              {result.curated_package.affiliate_links.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-6 mb-8 bg-yellow-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Affiliate Partnerships</h3>
                  <div className="space-y-2">
                    {result.curated_package.affiliate_links.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded">
                        <div>
                          <p className="font-semibold text-gray-900">{link.provider}</p>
                          <p className="text-xs text-gray-600">Commission: ${link.commission}</p>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Agent Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">✓</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Element Modal (simple inline) */}
              {showPayment && paymentOptions && stripePromise ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                    <h3 className="text-lg font-bold mb-4">Complete Payment</h3>
                    <Elements stripe={stripePromise} options={{ clientSecret: paymentOptions.clientSecret }}>
                      <CheckoutForm onSuccess={() => { setShowPayment(false); toast.success('Payment successful!'); }} />
                    </Elements>
                    <button onClick={() => setShowPayment(false)} className="mt-4 text-sm text-gray-600">Cancel</button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
