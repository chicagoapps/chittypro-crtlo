import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Document, Property } from "@shared/schema";

export default function DocumentGenerator() {
  const [formData, setFormData] = useState({
    documentType: "",
    title: "",
    propertyId: "",
    data: {},
  });

  const [specificData, setSpecificData] = useState<Record<string, any>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const generateDocumentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/documents", {
        ...data,
        data: specificData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Generated",
        description: "Your RTLO document has been created successfully.",
      });
      setFormData({ documentType: "", title: "", propertyId: "", data: {} });
      setSpecificData({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateDocumentMutation.mutate(formData);
  };

  const documentTypes = [
    { value: "security-deposit-notice", label: "Security Deposit Notice" },
    { value: "access-notice", label: "48-Hour Access Notice" },
    { value: "lease-addendum", label: "RTLO Compliance Addendum" },
    { value: "habitability-notice", label: "Habitability Notice" },
  ];

  const renderSpecificFields = () => {
    switch (formData.documentType) {
      case "security-deposit-notice":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Security Deposit Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={specificData.depositAmount || ""}
                onChange={(e) => setSpecificData({ ...specificData, depositAmount: e.target.value })}
                placeholder="1500.00"
                data-testid="input-deposit-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Rent</Label>
              <Input
                type="number"
                step="0.01"
                value={specificData.monthlyRent || ""}
                onChange={(e) => setSpecificData({ ...specificData, monthlyRent: e.target.value })}
                placeholder="1000.00"
                data-testid="input-monthly-rent"
              />
            </div>
            <div className="space-y-2">
              <Label>Tenant Name</Label>
              <Input
                value={specificData.tenantName || ""}
                onChange={(e) => setSpecificData({ ...specificData, tenantName: e.target.value })}
                placeholder="John Doe"
                data-testid="input-tenant-name"
              />
            </div>
          </div>
        );

      case "access-notice":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Access Date</Label>
              <Input
                type="date"
                value={specificData.accessDate || ""}
                onChange={(e) => setSpecificData({ ...specificData, accessDate: e.target.value })}
                data-testid="input-access-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Time</Label>
              <Input
                type="time"
                value={specificData.accessTime || ""}
                onChange={(e) => setSpecificData({ ...specificData, accessTime: e.target.value })}
                data-testid="input-access-time"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Access</Label>
              <Textarea
                value={specificData.reason || ""}
                onChange={(e) => setSpecificData({ ...specificData, reason: e.target.value })}
                placeholder="Routine maintenance inspection"
                data-testid="textarea-access-reason"
              />
            </div>
          </div>
        );

      case "habitability-notice":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Issue Description</Label>
              <Textarea
                value={specificData.issueDescription || ""}
                onChange={(e) => setSpecificData({ ...specificData, issueDescription: e.target.value })}
                placeholder="Describe the habitability issue..."
                className="min-h-[100px]"
                data-testid="textarea-issue-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Location of Issue</Label>
              <Input
                value={specificData.location || ""}
                onChange={(e) => setSpecificData({ ...specificData, location: e.target.value })}
                placeholder="Kitchen, bathroom, etc."
                data-testid="input-issue-location"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-8" data-testid="page-document-generator">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Document Generator</h1>
        <p className="text-muted-foreground">
          Generate RTLO-compliant notices, forms, and legal documents automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Document</CardTitle>
            <CardDescription>
              Create RTLO-compliant documents for your properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, documentType: value });
                    setSpecificData({});
                  }}
                  required
                >
                  <SelectTrigger data-testid="select-document-type">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Document title"
                  required
                  data-testid="input-document-title"
                />
              </div>

              {properties && properties.length > 0 && (
                <div className="space-y-2">
                  <Label>Property (Optional)</Label>
                  <Select 
                    value={formData.propertyId} 
                    onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                  >
                    <SelectTrigger data-testid="select-property">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.documentType && (
                <div className="space-y-2">
                  <Label>Document Details</Label>
                  {renderSpecificFields()}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={generateDocumentMutation.isPending || !formData.documentType || !formData.title}
                data-testid="button-generate-document"
              >
                {generateDocumentMutation.isPending ? "Generating..." : "Generate Document"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Document Types Info */}
        <Card>
          <CardHeader>
            <CardTitle>Available Documents</CardTitle>
            <CardDescription>
              RTLO-compliant document templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Security Deposit Notice</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Notice regarding security deposit terms and return requirements under RTLO Section 5-12-080.
                </p>
                <Badge variant="outline">Section 5-12-080</Badge>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">48-Hour Access Notice</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Required notice for landlord entry under RTLO Section 5-12-110.
                </p>
                <Badge variant="outline">Section 5-12-110</Badge>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">RTLO Compliance Addendum</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Lease addendum ensuring RTLO compliance and tenant awareness.
                </p>
                <Badge variant="outline">General Compliance</Badge>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Habitability Notice</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Notice for habitability issues under RTLO Section 5-12-140.
                </p>
                <Badge variant="outline">Section 5-12-140</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Documents */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              Recently generated RTLO documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-muted-foreground">Loading documents...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 border rounded-lg" data-testid={`document-${doc.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{doc.documentType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Generated: {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-view-${doc.id}`}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
