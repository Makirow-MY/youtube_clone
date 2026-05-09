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
                    <UserButton.Link
                        label="My Studio"
                        href="/studio"
                        labelIcon={<ClapperboardIcon className="w-4 h-4" />}
                    />
                </UserButton>
            </Show>

           
            <Show when="signed-out">
                {/* <SignInButton  mode='modal' /> */}
                <SignUpButton>
                    <Button
                        variant="outline"
                        className="px-4 py-2 text-sm cursor-pointer text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full shadow-none flex items-center gap-2"
                    >
                        <UserCircleIcon className="w-5 h-5" />
                        Sign in
                    </Button>
                </SignUpButton>
            </Show>

        </>
    );
}