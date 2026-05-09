import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images:{
    remotePatterns:[
      {
         protocol:"https",
         hostname:"image.mux.com"
      },
       {
         protocol:"https",
         hostname:"utfs.io"
      },
      {
        protocol:"https",
         hostname:"lnhbg16q41.ufs.sh"
      },
    ],
  },
  devIndicators: false,
};

export default nextConfig;
