import { Header } from "@/components/admin/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Copy, Eye, Trash, RefreshCw } from "lucide-react"

export default function ApiKeys() {
  return (
    <div className="min-h-screen bg-[#0f1424]">
      <Header title="API Keys" />

      <main className="p-6">
        <Card className="bg-[#1a1f36] border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">API Keys</h2>
                <p className="text-sm text-gray-400">Manage API keys for external integrations</p>
              </div>

              <div className="mt-4 md:mt-0">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New API Key
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Key</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Permissions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Last Used</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 px-4">Order Processing API</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span>••••••••••••••••</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">Read, Write</td>
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
                    <td className="py-4 px-4">Analytics Integration</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span>••••••••••••••••</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">Read</td>
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
                    <td className="py-4 px-4">Payment Gateway</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span>••••••••••••••••</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">Read, Write</td>
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
              <h3 className="text-lg font-medium mb-4">Create New API Key</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-name">API Key Name</Label>
                    <Input
                      id="api-name"
                      placeholder="Enter a name for this API key"
                      className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-permissions">Permissions</Label>
                    <Select defaultValue="read">
                      <SelectTrigger className="bg-[#0f1424] border-gray-700">
                        <SelectValue placeholder="Select permissions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read Only</SelectItem>
                        <SelectItem value="write">Write Only</SelectItem>
                        <SelectItem value="read-write">Read & Write</SelectItem>
                        <SelectItem value="admin">Admin (Full Access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-expiry">Expiry Date</Label>
                    <Input
                      id="api-expiry"
                      type="date"
                      className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="api-active">Active</Label>
                      <p className="text-sm text-gray-400">Enable or disable this API key</p>
                    </div>
                    <Switch id="api-active" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="api-ip-restriction">IP Restriction</Label>
                      <p className="text-sm text-gray-400">Restrict access to specific IP addresses</p>
                    </div>
                    <Switch id="api-ip-restriction" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="api-rate-limit">Rate Limiting</Label>
                      <p className="text-sm text-gray-400">Apply rate limiting to this API key</p>
                    </div>
                    <Switch id="api-rate-limit" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate API Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
