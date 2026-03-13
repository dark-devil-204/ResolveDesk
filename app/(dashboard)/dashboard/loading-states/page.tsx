"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonMessage,
} from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoadingStatesDemo() {
  const [showSkeletons, setShowSkeletons] = useState(true);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          Loading States & Skeletons
        </h1>
        <p className="mt-2 text-muted-foreground">
          Professional skeleton loading components for SaaS UIs
        </p>

        <div className="mt-4">
          <Button
            variant={showSkeletons ? "default" : "outline"}
            onClick={() => setShowSkeletons(!showSkeletons)}
          >
            {showSkeletons ? "Hide" : "Show"} Loading States
          </Button>
        </div>
      </section>

      {showSkeletons && (
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Card Loading State</CardTitle>
                <CardDescription>Skeleton for card components</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>List Loading State</CardTitle>
                <CardDescription>Skeleton for list items</CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Table Loading State</CardTitle>
                <CardDescription>Skeleton for tables</CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Thread Loading</CardTitle>
                <CardDescription>
                  Skeleton for message/conversation views
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SkeletonMessage />
                <SkeletonMessage />
                <SkeletonMessage />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Feature highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Improvements</CardTitle>
          <CardDescription>
            Professional SaaS navigation with tooltips and dark mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Features</h3>
            <ul className="list-inside space-y-1 text-sm text-muted-foreground">
              <li>✓ Fixed active state detection (no double highlighting)</li>
              <li>✓ Tooltips on nav links for better UX</li>
              <li>✓ Full dark mode support</li>
              <li>✓ Smooth transitions and hover effects</li>
              <li>✓ Professional card-based sidebar design</li>
              <li>✓ Enhanced header with better spacing</li>
              <li>✓ Improved mobile navigation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton variants */}
      <Card>
        <CardHeader>
          <CardTitle>Available Skeleton Variants</CardTitle>
          <CardDescription>
            Pre-built skeleton components for common UI patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="font-medium">SkeletonCard</p>
              <p className="text-xs text-muted-foreground">
                Loading state for card components
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">SkeletonList</p>
              <p className="text-xs text-muted-foreground">
                Loading state for list items
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">SkeletonTable</p>
              <p className="text-xs text-muted-foreground">
                Loading state for tables
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">SkeletonMessage</p>
              <p className="text-xs text-muted-foreground">
                Loading state for messages
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">SkeletonAvatar</p>
              <p className="text-xs text-muted-foreground">
                Loading state for avatars
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">SkeletonText</p>
              <p className="text-xs text-muted-foreground">
                Loading state for text content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
