import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Icons } from "@/components/Icons";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className='bg-white'>
      <section className='bg-white py-10'>
        <MaxWidthWrapper className='flex flex-col items-center gap-8 sm:gap-12'>
          <div className='gap-4 sm:gap-6'>
            <p className="flex-row text-gray-800 text-center text-sm">VOL-III</p>
            <h2 className='order-1 mt-2 tracking-tight text-center text-balance !leading-tight font-bold text-3xl md:text-5xl text-gray-900'>
              THE
              <span className='relative px-2'>
                MONARCH'S{'  '}
                <Icons.underline className='hidden sm:block pointer-events-none absolute inset-x-0 -bottom-6 text-brown-300' />
              </span>{' '}
              MUSE
            </h2>
            <p className="flex-row text-gray-800 text-center text-sm mt-5">Preserving the legacy of sophistication, rooted in old money tradition.</p>
          </div>

          <div className='mx-auto grid max-w-2xl grid-cols-1 px-4 lg:mx-0 lg:max-w-none lg:grid-cols-4 gap-y-12'>
            <div className="flex flex-auto relative flex-col lg:pr-2 gap-2 overflow-hidden group">
              <Image
                alt="Polos"
                src="/collections/polos.jpg"
                width={450}
                height={450}
                className="transition-transform duration-1000 ease-in-out group-hover:scale-110 object-cover"
              />
              <p className="absolute bottom-3 left-4 font-light">Polos</p>
              <p className="absolute bottom-3 right-5 font-light"><ArrowRight className="h-5 w-5 transition-transform duration-500 ease-in-out font-light group-hover:translate-x-3" /></p>
            </div>

            <div className="flex flex-auto relative flex-col lg:pr-2 gap-2 overflow-hidden group">
              <Image
                alt="Shirts"
                src="/collections/shirts.jpg"
                width={450}
                height={450}
                className="transition-transform duration-1000 ease-in-out group-hover:scale-110 object-cover"
              />
              <p className="absolute bottom-3 left-4 font-light">Shirts</p>
              <p className="absolute bottom-3 right-5 font-light"><ArrowRight className="h-5 w-5 transition-transform duration-500 ease-in-out font-light group-hover:translate-x-3" /></p>
            </div>

            <div className="flex flex-auto relative flex-col lg:pr-2 gap-2 overflow-hidden group">
              <Image
                alt="Sweaters"
                src="/collections/sweatshirts.jpg"
                width={450}
                height={450}
                className="transition-transform duration-1000 ease-in-out group-hover:scale-110 object-cover"
              />
              <p className="absolute bottom-3 left-4 font-light">Sweaters</p>
              <p className="absolute bottom-3 right-5 font-light"><ArrowRight className="h-5 w-5 transition-transform duration-500 ease-in-out font-light group-hover:translate-x-3" /></p>
            </div>

            <div className="flex flex-auto relative flex-col lg:pr-2 gap-2 overflow-hidden group">
              <Image
                alt="Hoodies"
                src="/collections/hoodies.jpg"
                width={450}
                height={450}
                className="transition-transform duration-1000 ease-in-out group-hover:scale-110 object-cover"
              />
              <p className="absolute bottom-3 left-4 font-light">Hoodies</p>
              <p className="absolute bottom-3 right-5 font-light"><ArrowRight className="h-5 w-5 transition-transform duration-500 ease-in-out font-light group-hover:translate-x-3" /></p>
            </div>

          </div>
        </MaxWidthWrapper>
      </section>

      <section>
        <MaxWidthWrapper className='py-24'>
          <div className='mb-12 px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl sm:text-center'>
              <h2 className='order-1 mt-2 tracking-tight text-center text-balance !leading-tight font-bold text-3xl md:text-5xl text-gray-900'>
                Design your {' '}<br></br>
                <span className='relative px-2 bg-blue-500 text-white'>
                  own Bracelet
                </span>{' '}
                now
              </h2>
              <Link
                href='/configure/design'
                className={buttonVariants({
                  size: 'lg',
                  className: 'hidden sm:flex mt-5 m-auto w-50 justify-center items-center gap-1 font-light',
                })}>
                Create a Design
                <ArrowRight className='ml-1.5 h-5 w-5' />
              </Link>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  );
}
