import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "@shared/schema";

export default function PropertyVerification() {
  const [formData, setFormData] = useState({
    address: "",
    city: "Chicago",
    zipCode: "",
    propertyType: "",
    units: 1,
    isOwnerOccupied: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const verifyPropertyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property Added",
        description: "Your property has been verified for RTLO coverage.",
      });
      setFormData({
        address: "",
        city: "Chicago",
        zipCode: "",
        propertyType: "",
        units: 1,
        isOwnerOccupied: false,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to verify property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPropertyMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-8" data-testid="page-property-verification">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Property Verification</h1>
        <p className="text-muted-foreground">
          Verify if your Chicago property is covered under the Residential Landlord and Tenant Ordinance (RTLO).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Property</CardTitle>
            <CardDescription>
              Enter your property details to check RTLO coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St"
                  required
                  data-testid="input-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="60601"
                    required
                    data-testid="input-zip"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select 
                  value={formData.propertyType} 
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  required
                >
                  <SelectTrigger data-testid="select-property-type">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-family">Single Family Home</SelectItem>
                    <SelectItem value="multi-unit">Multi-Unit Building</SelectItem>
                    <SelectItem value="condo">Condominium</SelectItem>
                    <SelectItem value="townhome">Townhome</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="units">Number of Units</Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 1 })}
                  data-testid="input-units"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ownerOccupied"
                  checked={formData.isOwnerOccupied}
                  onCheckedChange={(checked) => setFormData({ ...formData, isOwnerOccupied: checked as boolean })}
                  data-testid="checkbox-owner-occupied"
                />
                <Label htmlFor="ownerOccupied" className="text-sm">
                  Owner-occupied building
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifyPropertyMutation.isPending}
                data-testid="button-verify-property"
              >
                {verifyPropertyMutation.isPending ? "Verifying..." : "Verify Property"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* RTLO Coverage Info */}
        <Card>
          <CardHeader>
            <CardTitle>RTLO Coverage Rules</CardTitle>
            <CardDescription>
              Understanding what properties are covered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">RTLO Covers:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Most rental properties in Chicago</li>
                  <li>• Multi-unit buildings (7+ units)</li>
                  <li>• Single-family homes and condos (if not owner-occupied)</li>
                  <li>• Owner-occupied buildings with 7+ units</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">RTLO Does NOT Cover:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Owner-occupied buildings with 6 units or less</li>
                  <li>• Most hotels, motels, and rooming houses</li>
                  <li>• Dormitories and shelters</li>
                  <li>• Employee quarters</li>
                  <li>• Non-residential rental properties</li>
                  <li>• Owner-occupied co-ops</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Key RTLO Protections:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Security deposit limits (1.5x rent unfurnished, 2x furnished)</li>
                  <li>• 45-day security deposit return requirement</li>
                  <li>• Habitability standards</li>
                  <li>• Proper notice requirements for access</li>
                  <li>• Prohibition of retaliatory conduct</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property List */}
      {properties && properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
            <CardDescription>
              Properties you've verified for RTLO coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {properties.map((property: any) => (
                <div key={property.id} className="p-4 border rounded-lg" data-testid={`property-${property.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{property.address}</h4>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.zipCode}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{property.propertyType}</Badge>
                        <Badge variant="outline">{property.units} unit{property.units > 1 ? 's' : ''}</Badge>
                        {property.isOwnerOccupied && (
                          <Badge variant="outline">Owner-occupied</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={property.isRtloCovered ? "default" : "destructive"}>
                        {property.isRtloCovered ? "RTLO Covered" : "Not Covered"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Verified: {new Date(property.verificationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
