'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is an access token and recovery type in the hash (Supabase Auth redirect)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      
      if ((hash && hash.includes('access_token=')) || (search && (search.includes('code=') || search.includes('token=')))) {
        // We caught an auth redirect that was sent to the root!
        // The user requested that password resets always open on the school subdomain.
        // Since we use Implicit Flow, we can safely jump domains and carry the token in the hash!
        
        const host = window.location.host;
        let baseDomain = host;
        if (host.startsWith('admin.')) baseDomain = host.replace('admin.', '');
        else if (host.startsWith('school.')) baseDomain = host.replace('school.', '');
        
        const protocol = window.location.protocol;
        window.location.href = `${protocol}//school.${baseDomain}/reset-password${search}${hash}`;
        return;
      }
      
      // If it's a normal visit to the root, send them to login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
    </div>
  );
}
