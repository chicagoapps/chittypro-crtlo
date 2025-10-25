import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { AIAnalysis } from "@shared/schema";

export default function AIAnalysis() {
  const [leaseText, setLeaseText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading } = useQuery<AIAnalysis[]>({
    queryKey: ["/api/ai-analyses"],
  });

  const analyzeLeaseXMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/ai-analysis", { leaseText: text });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-analyses"] });
      toast({
        title: "Analysis Complete",
        description: "Your lease has been analyzed for RTLO compliance.",
      });
      setLeaseText("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to analyze lease. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaseText.trim()) return;
    analyzeLeaseXMutation.mutate(leaseText);
  };

  return (
    <div className="p-6 space-y-8" data-testid="page-ai-analysis">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">AI Lease Analysis</h1>
        <p className="text-muted-foreground">
          Upload and analyze your lease agreements for Chicago RTLO compliance using advanced AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analysis Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-robot text-primary"></i>
              Analyze Lease Document
            </CardTitle>
            <CardDescription>
              Paste your lease text below for AI-powered RTLO compliance analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={leaseText}
                onChange={(e) => setLeaseText(e.target.value)}
                placeholder="Paste your lease agreement text here..."
                className="min-h-[300px] font-mono text-sm"
                data-testid="textarea-lease-text"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{leaseText.length} characters</span>
                <span>Recommended: Full lease text for best results</span>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={analyzeLeaseXMutation.isPending || !leaseText.trim()}
                data-testid="button-analyze-lease"
              >
                {analyzeLeaseXMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search mr-2"></i>
                    Analyze Lease
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Analysis Features */}
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Features</CardTitle>
            <CardDescription>
              What our AI checks for in your lease
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center mt-1">
                  <i className="fas fa-shield-alt text-primary text-sm"></i>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Security Deposit Compliance</div>
                  <div className="text-sm text-muted-foreground">Checks deposit limits and return terms</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-secondary/10 w-8 h-8 rounded-lg flex items-center justify-center mt-1">
                  <i className="fas fa-gavel text-secondary text-sm"></i>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Prohibited Clauses</div>
                  <div className="text-sm text-muted-foreground">Identifies RTLO-prohibited lease terms</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-accent/10 w-8 h-8 rounded-lg flex items-center justify-center mt-1">
                  <i className="fas fa-home text-accent text-sm"></i>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Habitability Standards</div>
                  <div className="text-sm text-muted-foreground">Reviews landlord maintenance obligations</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center mt-1">
                  <i className="fas fa-key text-primary text-sm"></i>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Access Rights</div>
                  <div className="text-sm text-muted-foreground">Validates notice requirements and entry terms</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-secondary/10 w-8 h-8 rounded-lg flex items-center justify-center mt-1">
                  <i className="fas fa-file-contract text-secondary text-sm"></i>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Required Disclosures</div>
                  <div className="text-sm text-muted-foreground">Ensures RTLO summary attachment</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analyses && analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Your recent lease compliance analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-muted-foreground">Loading analyses...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {analyses.map((analysis: any) => (
                  <div key={analysis.id} className="p-6 border rounded-lg" data-testid={`analysis-${analysis.id}`}>
                    <div className="space-y-4">
                      {/* Compliance Score */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">Compliance Score</h4>
                          <p className="text-sm text-muted-foreground">
                            Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{analysis.complianceScore}%</div>
                          <Badge variant={analysis.complianceScore >= 80 ? "default" : analysis.complianceScore >= 60 ? "secondary" : "destructive"}>
                            {analysis.complianceScore >= 80 ? "Good" : analysis.complianceScore >= 60 ? "Fair" : "Needs Work"}
                          </Badge>
                        </div>
                      </div>

                      <Progress value={analysis.complianceScore} className="h-2" />

                      {/* Issues Found */}
                      {analysis.analysis?.issues && analysis.analysis.issues.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-foreground">Issues Found</h5>
                          <div className="space-y-2">
                            {analysis.analysis.issues.map((issue: any, index: number) => (
                              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge 
                                        variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'secondary' : 'outline'}
                                        className="text-xs"
                                      >
                                        {issue.severity} severity
                                      </Badge>
                                      {issue.section && (
                                        <Badge variant="outline" className="text-xs">
                                          Section {issue.section}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm font-medium text-foreground mb-1">{issue.issue}</div>
                                    <div className="text-xs text-muted-foreground">{issue.recommendation}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-foreground">Recommendations</h5>
                          <ul className="space-y-1">
                            {analysis.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start">
                                <i className="fas fa-check text-primary mr-2 mt-1 text-xs"></i>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
