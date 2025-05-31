import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Shield, Smartphone, Zap, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BeeMonitor</span>
            </div>
            <Link href="/dashboard">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-amber-100 rounded-full text-amber-800 text-sm font-medium mb-6">
              🐝 Smart Beehive Monitoring System
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Monitor Your Beehives
              <span className="block text-amber-600">Like Never Before</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Real-time monitoring of temperature, humidity, bee activity, and environmental conditions. Keep your
              colonies healthy with intelligent alerts and comprehensive analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-lg px-8 py-3">
                  Start Monitoring
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard/manage">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Add Your Hives
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Monitor Your Hives
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive monitoring system gives you complete visibility into your beehive health and activity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Real-time Monitoring</CardTitle>
                <CardDescription>
                  Track temperature, humidity, and environmental conditions 24/7 with live updates every 30 seconds.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>Bee Activity Tracking</CardTitle>
                <CardDescription>
                  Monitor bee flow and activity patterns to understand colony health and productivity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Smart Alerts</CardTitle>
                <CardDescription>
                  Get instant notifications when conditions go outside optimal ranges for bee health.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>ESP32 Integration</CardTitle>
                <CardDescription>
                  Easy setup with ESP32 devices for reliable, wireless monitoring of multiple hives.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Why Choose BeeMonitor?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Prevent Colony Loss</h3>
                    <p className="text-gray-600">
                      Early detection of temperature and humidity issues helps prevent colony collapse and disease.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Optimize Productivity</h3>
                    <p className="text-gray-600">
                      Track bee activity patterns to understand peak productivity times and optimize hive management.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Remote Monitoring</h3>
                    <p className="text-gray-600">
                      Monitor your hives from anywhere with real-time data and alerts sent directly to your device.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Easy Setup</h3>
                    <p className="text-gray-600">
                      Simple ESP32 device configuration with step-by-step instructions for quick deployment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🐝</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Join beekeepers who are already using smart monitoring to improve their hive management.
                </p>
                <Link href="/dashboard/manage">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                    Add Your First Hive
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Start Monitoring Your Beehives Today</h2>
          <p className="text-xl text-amber-100 mb-8">
            Get real-time insights into your colony health and never miss critical changes in your hive conditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                View Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard/manage">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-amber-600"
              >
                Setup Your Hives
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">BeeMonitor</span>
              </div>
              <p className="text-gray-400">Smart beehive monitoring for modern beekeepers.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Real-time Monitoring</li>
                <li>Smart Alerts</li>
                <li>Bee Activity Tracking</li>
                <li>ESP32 Integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Dashboard</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Main Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/comparison" className="hover:text-white">
                    Compare Hives
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/manage" className="hover:text-white">
                    Manage Hives
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>ESP32 Setup Guide</li>
                <li>Troubleshooting</li>
                <li>Best Practices</li>
                <li>Contact Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BeeMonitor. Built for beekeepers, by beekeepers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
