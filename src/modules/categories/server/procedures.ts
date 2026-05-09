import { db } from '@/db'
import {  baseProcedure, createTRPCRouter } from '@/trpc/init'
import {  videoTopics } from '@/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import z from 'zod'

export const CategoriesRouter = createTRPCRouter({
    getMany: baseProcedure.input(z.object({
                categoryId: z.string().nullish(),
            })).query(async ({input}) => {
const {categoryId} = input
       // const data = await db.select().from(categories).orderBy(desc(sql`RANDOM()`))
       const [dataMy] = await db.select().from(videoTopics).where(
       categoryId ?   eq(videoTopics.id, categoryId ) : undefined
    ).orderBy(desc(sql`RANDOM()`))
      const data = await db.select().from(videoTopics).orderBy(desc(sql`RANDOM()`))
     const groupedMap = new Map()
        
     if (categoryId) {
        groupedMap.set(dataMy.topicName, dataMy.id)
     }
        data.forEach(item => {
            if (!groupedMap.has(item.topicName)) {
                groupedMap.set(item.topicName, item.id)
            }
        })
         const groupedData = Array.from(groupedMap.entries()).map(([topicName, items]) => ({
            id: items, // You can choose how to set the id for the group, here I'm using the id of the first item
            topicName,
        }))
      const filterfITER =  groupedData.sort(() => Math.random() - 0.5)
      return filterfITER.slice(0, 10);
    })
})