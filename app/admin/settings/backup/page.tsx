import { Header } from "@/components/admin/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Download, Upload, Database, HardDrive, RefreshCw } from "lucide-react"

export default function Backup() {
  return (
    <div className="min-h-screen bg-[#0f1424]">
      <Header title="Backup & Restore" />

      <main className="p-6">
        <Card className="bg-[#1a1f36] border-0">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Backup & Restore</h2>
              <p className="text-sm text-gray-400">Manage database backups and restoration</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                      <Database size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Database Backup</h3>
                      <p className="text-sm text-gray-400">Create a backup of your database</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Automatic Backups</Label>
                        <p className="text-sm text-gray-400">Schedule regular backups</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Backup Frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="bg-[#1a1f36] border-gray-700">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-time">Backup Time</Label>
                      <Input
                        id="backup-time"
                        type="time"
                        defaultValue="02:00"
                        className="bg-[#1a1f36] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retention-period">Retention Period</Label>
                      <Select defaultValue="30">
                        <SelectTrigger className="bg-[#1a1f36] border-gray-700">
                          <SelectValue placeholder="Select retention period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      <Database className="mr-2 h-4 w-4" />
                      Create Manual Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1424] border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                      <HardDrive size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Restore Database</h3>
                      <p className="text-sm text-gray-400">Restore from a previous backup</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="restore-source">Restore Source</Label>
                      <Select defaultValue="cloud">
                        <SelectTrigger className="bg-[#1a1f36] border-gray-700">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cloud">Cloud Storage</SelectItem>
                          <SelectItem value="local">Local Backup</SelectItem>
                          <SelectItem value="upload">Upload Backup File</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-file">Upload Backup File</Label>
                      <div className="border-2 border-dashed border-gray-700 rounded-md p-6 text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400 mb-2">Drag and drop a backup file, or click to browse</p>
                        <Button variant="outline" className="bg-[#1a1f36] border-gray-700">
                          Browse Files
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-gray-400">Enable during restore</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <Button className="w-full bg-green-500 hover:bg-green-600">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restore Database
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg font-medium mb-4">Backup History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Backup ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 px-4">BKP-2023-06-15-001</td>
                    <td className="py-4 px-4">2023-06-15 02:00:00</td>
                    <td className="py-4 px-4">245 MB</td>
                    <td className="py-4 px-4">Automated</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Completed</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8">
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8">
                          <RefreshCw size={16} className="mr-2" />
                          Restore
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-4 px-4">BKP-2023-06-14-001</td>
                    <td className="py-4 px-4">2023-06-14 02:00:00</td>
                    <td className="py-4 px-4">242 MB</td>
                    <td className="py-4 px-4">Automated</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Completed</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8">
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8">
                          <RefreshCw size={16} className="mr-2" />
                          Restore
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">BKP-2023-06-13-001</td>
                    <td className="py-4 px-4">2023-06-13 02:00:00</td>
                    <td className="py-4 px-4">240 MB</td>
                    <td className="py-4 px-4">Automated</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Completed</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8">
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8">
                          <RefreshCw size={16} className="mr-2" />
                          Restore
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
