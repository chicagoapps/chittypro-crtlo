import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RTLOQuestion } from "@shared/schema";

export default function RtloQA() {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery<RTLOQuestion[]>({
    queryKey: ["/api/rtlo-questions"],
  });

  const askQuestionMutation = useMutation({
    mutationFn: async (questionText: string) => {
      const response = await apiRequest("POST", "/api/rtlo-questions", { question: questionText });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rtlo-questions"] });
      toast({
        title: "Question Answered",
        description: "Your RTLO question has been processed.",
      });
      setQuestion("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askQuestionMutation.mutate(question);
  };

  const sampleQuestions = [
    "What are the Chicago security deposit limits?",
    "How long does a landlord have to return my security deposit?",
    "What notice is required for landlord entry?",
    "Can my landlord raise rent during my lease term?",
    "What are my rights if my apartment has habitability issues?",
  ];

  return (
    <div className="p-6 space-y-8" data-testid="page-rtlo-qa">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">RTLO Q&A</h1>
        <p className="text-muted-foreground">
          Get instant answers to your Chicago Residential Landlord and Tenant Ordinance questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Question Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Describe your situation or ask about specific RTLO requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Example: What are the security deposit limits for my Chicago rental property?"
                  className="min-h-[120px]"
                  data-testid="textarea-question"
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={askQuestionMutation.isPending || !question.trim()}
                  data-testid="button-ask-question"
                >
                  {askQuestionMutation.isPending ? "Processing..." : "Ask Question"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Questions and Answers */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-muted-foreground">Loading your questions...</div>
                  </div>
                </CardContent>
              </Card>
            ) : questions && questions.length > 0 ? (
              questions.map((qa: any) => (
                <Card key={qa.id} data-testid={`question-${qa.id}`}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mt-1">
                          <i className="fas fa-question text-primary text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-2">
                            {qa.question}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Asked on {new Date(qa.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {qa.answer && (
                        <div className="bg-muted/50 rounded-lg p-4 ml-11">
                          <div className="flex items-start space-x-3">
                            <div className="bg-secondary/10 w-6 h-6 rounded-full flex items-center justify-center mt-1">
                              <i className="fas fa-robot text-secondary text-xs"></i>
                            </div>
                            <div className="flex-1 text-sm">
                              <div className="text-foreground mb-3 whitespace-pre-wrap">
                                {qa.answer}
                              </div>
                              <div className="flex items-center gap-2">
                                {qa.rtloSection && (
                                  <Badge variant="outline" className="text-xs">
                                    Section {qa.rtloSection}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={qa.confidence === 'high' ? 'default' : qa.confidence === 'medium' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {qa.confidence} confidence
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No questions yet</h3>
                    <p className="text-muted-foreground">Ask your first question about Chicago RTLO to get started.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sample Questions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Questions</CardTitle>
              <CardDescription>
                Common RTLO questions to get you started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleQuestions.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(sample)}
                    className="w-full text-left p-3 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    data-testid={`sample-question-${index}`}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RTLO Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="font-semibold text-primary text-sm mb-1">Security Deposits</div>
                <div className="text-xs text-muted-foreground">Max 1.5x monthly rent (unfurnished), 2x (furnished)</div>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <div className="font-semibold text-secondary text-sm mb-1">Deposit Return</div>
                <div className="text-xs text-muted-foreground">Within 45 days with itemized deductions</div>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <div className="font-semibold text-accent text-sm mb-1">Access Notice</div>
                <div className="text-xs text-muted-foreground">48-hour written notice required</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
