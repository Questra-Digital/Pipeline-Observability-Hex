import Image from 'next/image';
import Link from 'next/link';
import Enter from '../../public/assets/Images/Enter.png';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center py-10">
      <p className="text-teal-500 text-3xl font-bold my-5">Observability of CI/CD Pipelines In DevOps</p>
      <Link href="/configurePipeline" className="bg-red-600 px-7 py-3 rounded-full shadow-md flex hover:bg-red-500 transform duration-200">
        <button className="mx-px">Get Started</button>
        <Image src={Enter} alt="Enter Image" className="ml-3 w-8 h-8" />
      </Link>
    </main>
  );
}
