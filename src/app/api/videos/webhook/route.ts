
import { db } from "@/db"
import { videos } from "@/db/schema"
import { mux } from "@/lib/mux"
import {
    VideoAssetCreatedWebhookEvent, 
    VideoAssetDeletedWebhookEvent,
     VideoAssetErroredWebhookEvent,
      VideoAssetReadyWebhookEvent,
       VideoAssetTrackReadyWebhookEvent, 
       VideoAssetUpdatedWebhookEvent
} from "@mux/mux-node/resources/webhooks"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { string } from "zod"
import { UploadThingError, UTApi } from "uploadthing/server";




const SIGNING_SECRET = process.env.MUX_WEBHOOK!



type WebhookEvent = VideoAssetCreatedWebhookEvent
    | VideoAssetReadyWebhookEvent
    | VideoAssetErroredWebhookEvent
    | VideoAssetTrackReadyWebhookEvent
    | VideoAssetDeletedWebhookEvent
    | VideoAssetUpdatedWebhookEvent

export const POST = async (request: Request) => {
    if (!SIGNING_SECRET) {
        //toast.error("Missing MUX WEBHOOK")
        throw new Error("Missing MUX WEBHOOK")
    }

    const headersPayload = await headers();
    const muxSignature = headersPayload.get("mux-signature")


    if (!muxSignature) {
        // //toast.error("Missing mu")
        return new Response("No signature found", {
            status: 401
        })
    }


    const payload = await request.json()

    ////console.log({payload,  request})
    const body = JSON.stringify(payload);

    mux.webhooks.verifySignature(
        body,
        {
            "mux-signature": muxSignature
        },
        SIGNING_SECRET
    )



    switch (payload.type as WebhookEvent["type"]) {
        case "video.asset.created": {
            //console.log("Video is now created")

            const data = payload.data as VideoAssetCreatedWebhookEvent['data'];

            if (!data.upload_id) {
                //toast.error("Missing video")
                return new Response("No video upload id found", {
                    status: 400
                })
            }

            try {
                await db.update(videos).set({
                    muxAssetId: data.id,
                    muxStatus: data.status
                }).where(eq(videos.muxUploadId, data.upload_id));

            } catch (error) {
                new Response("Failed to update video when video is pulblished", {
                    status: 400
                })
            }

            break;
        }


        case "video.asset.ready": {

            //console.log("Video is ready now")
            const data = payload.data as VideoAssetReadyWebhookEvent['data'];
            const playbackId = data.playback_ids?.[0]?.id;
            let downloadUrl = null;

            // Check if master file is ready and accessible
            if (data.master && data.master.status === 'ready' && data.master.url) {
                downloadUrl = `${data.master.url}&download=${playbackId}.mp4`;
            }
            else if (data.master_access === 'temporary' && data.id) {
                // You might need to generate a signed URL using Mux's API
                const asset = await mux.video.assets.retrieve(data.id);
                if (asset.master && asset.master.url) {
                    downloadUrl = `${asset.master.url}&download=${playbackId}.mp4`;
                }
            }
            if (!data.upload_id) {
                //toast.error("Missing video")
                return new Response("No video upload id found", {
                    status: 400
                })
            }

            if (!playbackId) {
                //toast.error("Missing video")
                return new Response("Missing Play Back Id", {
                    status: 400
                })
            }


            const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
            const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`
            const duration = data.duration ? Math.round(data.duration * 1000) : 0

            // const utapi = new UTApi()
            // const [UPthumbnailUrl, UPpreviewUrl] = await utapi.uploadFilesFromUrl([
            //     tempThumbnailUrl,
            //     tempPreviewUrl
            // ])

            // if (!UPpreviewUrl.data || !UPthumbnailUrl.data) {
            //     return new Response("Failed to upload thumbnail or preview", {
            //         status: 500
            //     })
            // }

            // const { key: thumbnailKey, ufsUrl: thumbnailUrl } = UPthumbnailUrl?.data
            // const { key: previewKey, ufsUrl: previewUrl } = UPpreviewUrl?.data
            try {

                await db.update(videos).set({
                    thumbnailUrl: tempThumbnailUrl,
                    thumbnailKey:  null,
                    previewUrl:  tempPreviewUrl,
                    previewKey: null,
                    downloadUrl: downloadUrl,
                    muxPlaybakId: playbackId,
                    muxStatus: data.status,
                    muxAssetId: data.id,
                    duration: duration,
                }).where(eq(videos.muxUploadId, data.upload_id));



            } catch (error) {
                console.error(error)
                new Response("Failed to update video when video is ready", {
                    status: 400
                })
            }
            break;
        }

        case "video.asset.updated": {


            const data = payload.data as VideoAssetUpdatedWebhookEvent['data'];
            const playbackId = data.playback_ids?.[0]?.id;
            let downloadUrl = null;

            // Check if master file is ready and accessible
            if (data.master && data.master.status === 'ready' && data.master.url) {
                downloadUrl = `${data.master.url}&download=${playbackId}.mp4`;
            }
            else if (data.master_access === 'temporary' && data.id) {
                // You might need to generate a signed URL using Mux's API
                const asset = await mux.video.assets.retrieve(data.id);
                if (asset.master && asset.master.url) {
                    downloadUrl = `${asset.master.url}&download=${playbackId}.mp4`;
                }
            }
            if (!data.upload_id) {
                //toast.error("Missing video")
                return new Response("No video upload id found", {
                    status: 400
                })
            }

            if (!playbackId) {
                //toast.error("Missing video")
                return new Response("Missing Play Back Id", {
                    status: 400
                })
            }


            

            const [video] = await db.select().from(videos).where(eq(videos.muxUploadId, data.upload_id));

            const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
            const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`
            const duration = data.duration ? Math.round(data.duration * 1000) : 0

            if (!video) {
                return new Response("Video not found", {
                    status: 404
                })
            }
            else {
                   
         if (!video.thumbnailUrl && !video.thumbnailKey && !video.previewUrl && !video.previewKey) {

                     try {

                         const utapi = new UTApi()
                   
                    if (!video.thumbnailUrl && !video.thumbnailKey) {

                        const MythumbnailUrl = await utapi.uploadFilesFromUrl(tempThumbnailUrl)
                        if (!MythumbnailUrl.data) {
                            return new Response("Failed to upload thumbnail", {
                                status: 500
                            })
                        }
                        else {

                            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = MythumbnailUrl.data

                            await db.update(videos).set({
                                thumbnailUrl: thumbnailUrl,
                                thumbnailKey: thumbnailKey,
                                downloadUrl: downloadUrl,

                            }).where(eq(videos.muxUploadId, data.upload_id));

                        }

                    }

                   if (!video.previewUrl && !video.previewKey) {

                        const MythumbnailUrl = await utapi.uploadFilesFromUrl(tempPreviewUrl)
                        if (!MythumbnailUrl.data) {
                            return new Response("Failed to upload preview", {
                                status: 500
                            })
                        }
                        else {

                            const { key: previewKey, ufsUrl: previewUrl } = MythumbnailUrl.data

                            await db.update(videos).set({
                                 previewUrl: previewUrl,
                                 previewKey: previewKey,
                                downloadUrl: downloadUrl,

                            }).where(eq(videos.muxUploadId, data.upload_id));

                        }

                    }


                    } catch (error) {
                        console.error(error)
                        new Response("Failed to update video when video is ready", {
                            status: 400
                        })
                    }

                }

               else if ((video.thumbnailUrl || !video.thumbnailKey) || (video.previewUrl && !video.previewKey)) {

                     try {

                         const utapi = new UTApi()
                   
                    if (video.thumbnailUrl && !video.thumbnailKey) {

                        const MythumbnailUrl = await utapi.uploadFilesFromUrl(tempThumbnailUrl)
                        if (!MythumbnailUrl.data) {
                            return new Response("Failed to upload thumbnail", {
                                status: 500
                            })
                        }
                        else {

                            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = MythumbnailUrl.data

                            await db.update(videos).set({
                                thumbnailUrl: thumbnailUrl,
                                thumbnailKey: thumbnailKey,
                                downloadUrl: downloadUrl,

                            }).where(eq(videos.muxUploadId, data.upload_id));

                        }

                    }

                   if (video.previewUrl && !video.previewKey) {

                        const MythumbnailUrl = await utapi.uploadFilesFromUrl(tempPreviewUrl)
                        if (!MythumbnailUrl.data) {
                            return new Response("Failed to upload preview", {
                                status: 500
                            })
                        }
                        else {

                            const { key: previewKey, ufsUrl: previewUrl } = MythumbnailUrl.data

                            await db.update(videos).set({
                                 previewUrl: previewUrl,
                                 previewKey: previewKey,
                                downloadUrl: downloadUrl,

                            }).where(eq(videos.muxUploadId, data.upload_id));

                        }

                    }


                    } catch (error) {
                        console.error(error)
                        new Response("Failed to update video when video is ready", {
                            status: 400
                        })
                    }

                }


            }
            break;
        }

        case "video.asset.errored": {


            const data = payload.data as VideoAssetErroredWebhookEvent['data'];

            if (!data.upload_id) {
                //toast.error("Missing video")
                return new Response("No video upload id found", {
                    status: 400
                })
            }

            try {
                await db.update(videos).set({
                    muxStatus: data.status,
                }).where(eq(videos.muxUploadId, data.upload_id));

            } catch (error) {
                console.error(error)
                new Response("Failed to update video when video has error", {
                    status: 400
                })
            }
            break;
        }


        case "video.asset.deleted": {

            const data = payload.data as VideoAssetDeletedWebhookEvent['data'];

            if (!data.upload_id) {
                //toast.error("Missing video")
                return new Response("No video upload id found", {
                    status: 400
                })
            }

            try {
                await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
            } catch (error) {
                console.error(error)
                new Response("Failed to update video when video has error", {
                    status: 400
                })
            }
            break;
        }

        case "video.asset.track.ready": {

            const data = payload.data as VideoAssetTrackReadyWebhookEvent['data'] & {
                asset_id: string;
            };
            const assertId = data.asset_id;
            const trackId = data.id;
            const status = data.status


            if (!assertId) {
                //toast.error("Missing video")
                new Response("Missing Asset id found", {
                    status: 400
                })
            }

            try {
                await db.update(videos).set({
                    muxTrackId: trackId || data.id,
                    muxTrackStatus: status || data.status
                }).where(eq(videos.muxAssetId, assertId));

            } catch (error) {
                console.error(error)
                new Response("Failed to update video when video has error", {
                    status: 400
                })
            }
            break;
        }


    }
    //toast.success("Webhook received sucessfully")
    return new Response("Webhook received sucessfully", {
        status: 200
    })
}