import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Property, RTLOQuestion, Document, AIAnalysis } from "@shared/schema";

export default function Home() {
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: recentQuestions } = useQuery<RTLOQuestion[]>({
    queryKey: ["/api/rtlo-questions"],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  return (
    <div className="p-6 space-y-8" data-testid="page-home">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to ChittyPro
        </h1>
        <p className="text-muted-foreground">
          Your comprehensive Chicago RTLO compliance platform.
        </p>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Activity</CardTitle>
          <CardDescription>Track your RTLO compliance progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{properties?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Properties Verified</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{recentQuestions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">RTLO Questions Asked</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">{documents?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Documents Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/properties">
          <Card className="hover-elevate cursor-pointer" data-testid="card-property-verification">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-building text-primary"></i>
                </div>
                <div>
                  <CardTitle className="text-lg">Property Verification</CardTitle>
                  <CardDescription>Check RTLO coverage</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/rtlo-qa">
          <Card className="hover-elevate cursor-pointer" data-testid="card-rtlo-qa">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="bg-secondary/10 w-10 h-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-secondary"></i>
                </div>
                <div>
                  <CardTitle className="text-lg">RTLO Q&A</CardTitle>
                  <CardDescription>Get instant answers</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/documents">
          <Card className="hover-elevate cursor-pointer" data-testid="card-document-generator">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="bg-accent/10 w-10 h-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-alt text-accent"></i>
                </div>
                <div>
                  <CardTitle className="text-lg">Document Generator</CardTitle>
                  <CardDescription>Create compliant forms</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/ai-analysis">
          <Card className="hover-elevate cursor-pointer" data-testid="card-ai-analysis">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-primary"></i>
                </div>
                <div>
                  <CardTitle className="text-lg">AI Lease Analysis</CardTitle>
                  <CardDescription>Analyze lease documents</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/legal-aid">
          <Card className="hover-elevate cursor-pointer" data-testid="card-legal-aid">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="bg-secondary/10 w-10 h-10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-gavel text-secondary"></i>
                </div>
                <div>
                  <CardTitle className="text-lg">Legal Aid Directory</CardTitle>
                  <CardDescription>Find free legal help</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
            <CardDescription>Your latest RTLO inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQuestions?.length ? (
              <div className="space-y-3">
                {recentQuestions.slice(0, 3).map((question: any) => (
                  <div key={question.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-foreground truncate">
                      {question.question}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {question.rtloSection && (
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded mr-2">
                          {question.rtloSection}
                        </span>
                      )}
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-comments text-4xl mb-2"></i>
                <div>No questions asked yet</div>
                <div className="text-sm">Ask your first RTLO question to get started</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Your generated RTLO documents</CardDescription>
          </CardHeader>
          <CardContent>
            {documents?.length ? (
              <div className="space-y-3">
                {documents.slice(0, 3).map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-foreground truncate">
                      {doc.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="bg-accent/20 text-accent px-2 py-1 rounded mr-2">
                        {doc.documentType}
                      </span>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-file-alt text-4xl mb-2"></i>
                <div>No documents generated yet</div>
                <div className="text-sm">Create your first RTLO document</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
