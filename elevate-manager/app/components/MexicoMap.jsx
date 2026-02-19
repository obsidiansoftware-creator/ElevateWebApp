"use client"

import dynamic from "next/dynamic"

const MexicoMapClient = dynamic(
  () => import("./MexicoMapClient"),
  { ssr: false }
)

export default function MexicoMap() {
  return <MexicoMapClient />
}

