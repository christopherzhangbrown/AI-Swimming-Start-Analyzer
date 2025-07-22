import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-blue-600">
              SwimStart
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/analyze" className="text-sm font-medium">
              Analyze
            </Link>
            <Link href="/about" className="text-sm font-medium">
              About
            </Link>
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 md:py-16 lg:py-20 bg-blue-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About SwimStart</h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  SwimStart is an innovative web-based tool designed to help swimmers improve their starts through
                  AI-powered analysis and personalized feedback.
                </p>
              </div>
              <div className="mx-auto lg:mx-0 rounded-lg overflow-hidden shadow-xl">
                <img
                  alt="Swimming competition start"
                  className="aspect-video object-cover w-full"
                  src="/placeholder.svg?height=400&width=600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">Our Technology</h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[700px] mx-auto">
                SwimStart combines cutting-edge AI technologies to provide detailed analysis of your swimming start
                technique
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <div className="bg-blue-100 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Pose Detection</h3>
                  <p className="text-gray-600">
                    Our advanced pose detection algorithms track key joint positions throughout your swimming start,
                    providing precise data on body mechanics.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-100 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">AI Analysis</h3>
                  <p className="text-gray-600">
                    Large language models analyze your technique patterns, comparing them to optimal swimming start
                    mechanics to identify areas for improvement.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-100 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Visual Feedback</h3>
                  <p className="text-gray-600">
                    Interactive visualizations overlay pose data on your video, making it easy to understand and
                    implement technique improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="mx-auto lg:mx-0 rounded-lg overflow-hidden shadow-xl order-2 lg:order-1">
                <img
                  alt="Coach analyzing swimming technique"
                  className="aspect-video object-cover w-full"
                  src="/placeholder.svg?height=400&width=600"
                />
              </div>
              <div className="space-y-4 order-1 lg:order-2">
                <h2 className="text-3xl font-bold tracking-tighter">For Swimmers and Coaches</h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  SwimStart is designed for swimmers of all levels, from beginners to elite athletes, as well as coaches
                  looking to provide data-driven feedback to their teams.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Objective analysis of start technique</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Personalized improvement recommendations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Track progress over time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Share analysis with coaches or teammates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20 bg-blue-50">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4 max-w-[700px] mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter">Ready to Improve Your Swimming Start?</h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join SwimStart today and take your swimming performance to the next level with AI-powered technique
                analysis
              </p>
              <div className="flex justify-center pt-4">
                <Link href="/analyze">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Start Your Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">© 2024 SwimStart. All rights reserved.</p>
          </div>
          <nav className="flex items-center justify-center gap-4 md:justify-end">
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-gray-500 hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
