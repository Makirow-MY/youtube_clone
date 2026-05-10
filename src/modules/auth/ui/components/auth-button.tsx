"use client";

import { Button } from '@/components/ui/button';
import { ClapperboardIcon, UserCircleIcon } from 'lucide-react';
import React from 'react';
import {
    Show, SignInButton, SignUpButton, UserButton
} from "@clerk/nextjs";

export function Authbutton() {
    return (
        <>
            <Show when="signed-in">
                <UserButton
                    appearance={{
                        elements: {
                            userButtonBox: "hover:scale-105 transition-transform",
                        },
                    }}
                >
                    {/* Custom Menu Item in Clerk v7 */}
                <UserButton.MenuItems>
                        <UserButton.Link
                            label="My Studio"
                            href="/studio"
                            labelIcon={<ClapperboardIcon className="w-4 h-4" />}
                        />
                    </UserButton.MenuItems>
                </UserButton>
            </Show>

           
            <Show when="signed-out">
                <SignInButton   mode='modal' >
                <SignUpButton>
                    <Button
                        variant="outline"
                       className="p-4 text-sm cursor-pointer rounded-full shadow-none flex items-center gap-2"
                    >
                        <UserCircleIcon className="size-5" />
                        Sign in
                    </Button>
                </SignUpButton>
                </SignInButton>
            </Show>

        </>
    );
}



