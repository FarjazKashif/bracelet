// import { db } from "@/db"
import { notFound } from "next/navigation"
import DesignConfigurator from "./DesignConfigurator"

interface searchParamsProps {
    searchParams: {
        [key: string]: string | string[] | undefined
    }
}

const Page = async ({ searchParams }: searchParamsProps) => {
    // const { id } = searchParams

    // if (!id || typeof id !== "string") {
    //     return notFound()
    // }

    // const configuration = await db.configuration.findUnique({
    //     where: { id },
    // })

    // if (!configuration) {
    //     return notFound()
    // }

    // const { imageUrl, height, width } = configuration

    return <DesignConfigurator />
}

export default Page