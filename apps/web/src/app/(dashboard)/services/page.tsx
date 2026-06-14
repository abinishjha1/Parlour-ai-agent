import { getCurrentSalon } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getServices, deleteService, createService } from "./actions";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ServicesPage() {
  const { salonId } = await getCurrentSalon();
  const services = await getServices(salonId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground">Manage the services offered at your salon.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a new service offering for your salon.</DialogDescription>
            </DialogHeader>
            <form action={async (formData) => {
              "use server";
              await createService(salonId, formData);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Men's Haircut" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input id="price" name="price" type="number" step="0.01" required placeholder="500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input id="duration" name="duration" type="number" required placeholder="30" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="categoryId" placeholder="e.g. Hair, Spa, Bridal" />
              </div>
              <Button type="submit" className="w-full">Save Service</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No services found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    {service.categoryId && <Badge variant="secondary">{service.categoryId}</Badge>}
                  </TableCell>
                  <TableCell>{service.duration} mins</TableCell>
                  <TableCell className="text-right">₹{service.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <form action={async () => {
                      "use server";
                      await deleteService(service.id);
                    }}>
                      <Button variant="ghost" size="icon" type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
