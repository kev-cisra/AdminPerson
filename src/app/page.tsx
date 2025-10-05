import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const params = useSearchParams();
  

  return (
    <div>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi facere, quisquam eveniet nulla sunt praesentium vitae porro eum pariatur laboriosam totam nam similique eius voluptatum itaque dolor animi officiis est.
    </div>
  );
}
