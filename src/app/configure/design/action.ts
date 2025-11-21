"use server"

import { db } from "@/db"
import { Shape, Color, Material, Pendant } from "@prisma/client"

export type SaveConfigArgs = {
    color: Color,
    shape: Shape,
    material: Material,
    pendant: Pendant,
    configId: string,
}

