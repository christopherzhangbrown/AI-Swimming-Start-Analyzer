import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Video, Upload, Award } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">SwimStart</span>
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
        <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Improve Your Swimming Start with AI Analysis
                </h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Upload a video of your swimming start and get instant AI-powered feedback on your technique. Visualize
                  your body mechanics and receive personalized recommendations to enhance your performance.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/analyze">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      Start Analysis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 rounded-lg overflow-hidden shadow-xl">
                <img
                  alt="Swimming start analysis visualization"
                  className="aspect-video object-cover w-full"
                  src="/placeholder.svg?height=400&width=600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">How It Works</h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[700px] mx-auto">
                Our AI-powered platform analyzes your swimming start technique in three simple steps
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Upload Your Video</h3>
                <p className="text-gray-500">
                  Upload a video of your swimming start or record one directly using your webcam
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Video className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">AI Analysis</h3>
                <p className="text-gray-500">
                  Our AI detects your body position and analyzes your technique across every frame
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Get Feedback</h3>
                <p className="text-gray-500">Receive personalized recommendations to improve your start technique</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20 bg-blue-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter">Advanced Pose Detection Technology</h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform uses state-of-the-art pose detection to track key joint positions throughout your
                  swimming start. Visualize head, shoulders, hips, knees, and ankles to understand your body mechanics
                  in detail.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Track joint positions in real-time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Analyze body angles and alignment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Identify areas for technique improvement</span>
                  </li>
                </ul>
              </div>
              <div className="mx-auto lg:mx-0 rounded-lg overflow-hidden shadow-xl">
                <img
                  alt="Pose detection visualization"
                  className="aspect-video object-cover w-full"
                  src="/placeholder.svg?height=400&width=600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter">Ready to Improve Your Start?</h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[700px] mx-auto">
                Get started with SwimStart today and take your swimming performance to the next level
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
