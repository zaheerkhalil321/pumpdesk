"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/common/Typography";

export function GeneralSettings() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <Card>

        <CardHeader>

          <CardTitle>
            Business
          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-6">

          <div className="space-y-2">

            <Typography.Small>
              Company Name
            </Typography.Small>

            <Input
              defaultValue="Midcoast Concrete Pumping"
            />

          </div>

          <div className="space-y-2">

            <Typography.Small>
              Billing Email
            </Typography.Small>

            <Input
              defaultValue="hello@midcoastpumping.com"
            />

          </div>

          <div className="space-y-2">

            <Typography.Small>
              Invoice Footer
            </Typography.Small>

            <Input
              defaultValue="Thanks for choosing Midcoast!"
            />

          </div>

        </CardContent>

      </Card>

      <div className="flex justify-end">

        <Button>
          Save Changes
        </Button>

      </div>

    </div>
  );
}