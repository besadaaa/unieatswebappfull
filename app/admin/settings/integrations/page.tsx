import { Header } from "@/components/admin/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { CreditCard, MessageSquare, BarChart4, Truck, ShoppingBag, Mail, Plus } from "lucide-react"

export default function Integrations() {
  return (
    <div className="min-h-screen bg-[#0f1424]">
      <Header title="Integrations" />

      <main className="p-6">
        <Card className="bg-[#1a1f36] border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">Integrations</h2>
                <p className="text-sm text-gray-400">Manage third-party service integrations</p>
              </div>

              <div className="mt-4 md:mt-0">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Integration
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                      <CreditCard size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Payment Gateway</h3>
                      <p className="text-sm text-gray-400">Stripe payment processing</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-500">Connected</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="bg-[#1a1f36] border-gray-700">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                      <MessageSquare size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Chat Support</h3>
                      <p className="text-sm text-gray-400">Intercom customer messaging</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-500">Connected</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="bg-[#1a1f36] border-gray-700">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                      <BarChart4 size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Analytics</h3>
                      <p className="text-sm text-gray-400">Google Analytics tracking</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-500">Connected</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="bg-[#1a1f36] border-gray-700">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                      <Truck size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Delivery Service</h3>
                      <p className="text-sm text-gray-400">Third-party delivery integration</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-red-500">Disconnected</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="bg-[#1a1f36] border-gray-700">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                      <ShoppingBag size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Inventory Management</h3>
                      <p className="text-sm text-gray-400">Automated inventory tracking</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-red-500">Disconnected</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="bg-[#1a1f36] border-gray-700">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                      <Mail size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">Email Marketing</h3>
                      <p className="text-sm text-gray-400">Mailchimp integration</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-500">Connected</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" className="bg-[#1a1f36] border-gray-700">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Available Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#0f1424] border-0">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">LinkedIn</h4>
                    <p className="text-xs text-gray-400 mb-3">Social media integration</p>
                    <Button variant="outline" size="sm" className="w-full bg-[#1a1f36] border-gray-700">
                      Connect
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f1424] border-0">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Google Maps</h4>
                    <p className="text-xs text-gray-400 mb-3">Location services</p>
                    <Button variant="outline" size="sm" className="w-full bg-[#1a1f36] border-gray-700">
                      Connect
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f1424] border-0">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <h4 className="font-medium mb-1">Slack</h4>
                    <p className="text-xs text-gray-400 mb-3">Team communication</p>
                    <Button variant="outline" size="sm" className="w-full bg-[#1a1f36] border-gray-700">
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
