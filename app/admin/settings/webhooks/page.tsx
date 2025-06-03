import { Header } from "@/components/admin/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash, RefreshCw, ExternalLink } from "lucide-react"

export default function Webhooks() {
  return (
    <div className="min-h-screen bg-[#0f1424]">
      <Header title="Webhooks" />

      <main className="p-6">
        <Card className="bg-[#1a1f36] border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">Webhooks</h2>
                <p className="text-sm text-gray-400">Manage webhooks for real-time event notifications</p>
              </div>

              <div className="mt-4 md:mt-0">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Webhook
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">URL</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Events</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Last Triggered</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 px-4">Order Notifications</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">https://api.example.com/webhooks/orders</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">order.created, order.updated</td>
                    <td className="py-4 px-4">2023-05-15</td>
                    <td className="py-4 px-4">Today</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Active</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 px-4">User Registrations</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">https://api.example.com/webhooks/users</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">user.created, user.updated</td>
                    <td className="py-4 px-4">2023-04-20</td>
                    <td className="py-4 px-4">Yesterday</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Active</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">Payment Events</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">https://api.example.com/webhooks/payments</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">payment.succeeded, payment.failed</td>
                    <td className="py-4 px-4">2023-03-10</td>
                    <td className="py-4 px-4">2 weeks ago</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">Inactive</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Add New Webhook</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-name">Webhook Name</Label>
                    <Input
                      id="webhook-name"
                      placeholder="Enter a name for this webhook"
                      className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://your-domain.com/webhook"
                      className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Secret Key</Label>
                    <Input
                      id="webhook-secret"
                      placeholder="Enter a secret key for signature verification"
                      className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Events to Subscribe</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="event-order-created" />
                        <Label htmlFor="event-order-created">order.created</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="event-order-updated" />
                        <Label htmlFor="event-order-updated">order.updated</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="event-order-completed" />
                        <Label htmlFor="event-order-completed">order.completed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="event-payment-succeeded" />
                        <Label htmlFor="event-payment-succeeded">payment.succeeded</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="event-payment-failed" />
                        <Label htmlFor="event-payment-failed">payment.failed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="event-user-created" />
                        <Label htmlFor="event-user-created">user.created</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webhook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
