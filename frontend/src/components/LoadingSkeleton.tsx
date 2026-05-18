import React from "react";

const shimmer = "animate-pulse bg-[#dfd7e5]";

export const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#ccc3d7]/10 p-4 animate-pulse flex flex-col gap-4">
    <div className="aspect-[3/4] bg-[#dfd7e5] rounded-2xl w-full" />
    <div className={`h-3 ${shimmer} rounded w-1/3`} />
    <div className={`h-5 ${shimmer} rounded w-2/3`} />
    <div className={`h-4 ${shimmer} rounded w-full`} />
    <div className="mt-auto flex justify-between items-center">
      <div className={`h-3 ${shimmer} rounded w-1/4`} />
      <div className={`h-3 ${shimmer} rounded w-1/5`} />
    </div>
  </div>
);

export const FabricSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#ccc3d7]/10 p-4 animate-pulse flex flex-col gap-4">
    <div className="h-[220px] bg-[#dfd7e5] rounded-2xl w-full" />
    <div className={`h-4 ${shimmer} rounded w-2/3`} />
    <div className={`h-3 ${shimmer} rounded w-1/2`} />
    <div className={`h-3 ${shimmer} rounded w-1/3`} />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-[#ccc3d7]/10">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-10 rounded-xl bg-[#dfd7e5]" />
        <div className="flex flex-col gap-2">
          <div className={`h-3 ${shimmer} rounded w-24`} />
          <div className={`h-2 ${shimmer} rounded w-32`} />
        </div>
      </div>
    </td>
    <td className="px-6 py-4"><div className={`h-4 ${shimmer} rounded w-16`} /></td>
    <td className="px-6 py-4"><div className={`h-4 ${shimmer} rounded w-20`} /></td>
    <td className="px-6 py-4"><div className={`h-4 ${shimmer} rounded w-12`} /></td>
    <td className="px-6 py-4 text-right"><div className={`h-7 ${shimmer} rounded-full w-16 inline-block`} /></td>
  </tr>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse">
    <div className="md:col-span-8 bg-white rounded-2xl border border-[#ccc3d7]/10 p-6 flex flex-col gap-6">
      <div className="flex justify-between">
        <div className={`h-6 ${shimmer} rounded w-48`} />
        <div className={`h-8 ${shimmer} rounded-xl w-32`} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className={`h-3 ${shimmer} rounded w-24 mb-2`} />
            <div className={`h-7 ${shimmer} rounded w-20`} />
          </div>
        ))}
      </div>
      <div className={`h-48 ${shimmer} rounded-2xl`} />
    </div>
    <div className="md:col-span-4 bg-[#5300b7]/10 rounded-2xl p-6 flex flex-col gap-4">
      <div className={`h-12 ${shimmer} rounded-full w-12`} />
      <div className={`h-6 ${shimmer} rounded w-3/4`} />
      <div className={`h-4 ${shimmer} rounded w-full`} />
      {[1, 2, 3, 4].map(i => <div key={i} className={`h-10 ${shimmer} rounded-xl`} />)}
    </div>
    <div className="md:col-span-6 bg-white rounded-2xl border border-[#ccc3d7]/10 p-6 flex flex-col gap-4">
      <div className={`h-6 ${shimmer} rounded w-40`} />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4">
          <div className={`w-14 h-16 ${shimmer} rounded-xl`} />
          <div className="flex-grow space-y-2">
            <div className={`h-3 ${shimmer} rounded w-3/4`} />
            <div className={`h-3 ${shimmer} rounded w-1/2`} />
          </div>
        </div>
      ))}
    </div>
    <div className="md:col-span-6 bg-white rounded-2xl border border-[#ccc3d7]/10 p-6 flex flex-col gap-4">
      <div className={`h-6 ${shimmer} rounded w-40`} />
      {[1, 2, 3].map(i => <div key={i} className={`h-10 ${shimmer} rounded-xl`} />)}
      <div className={`h-12 ${shimmer} rounded-full mt-auto`} />
    </div>
  </div>
);

export const OrderSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-[#ccc3d7]/10 p-6 animate-pulse flex flex-col gap-4">
    <div className="flex justify-between">
      <div className={`h-4 ${shimmer} rounded w-32`} />
      <div className={`h-5 ${shimmer} rounded-full w-20`} />
    </div>
    <div className={`h-3 ${shimmer} rounded w-48`} />
    <div className="flex gap-3">
      {[1, 2].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-12 h-14 ${shimmer} rounded-xl`} />
          <div className="space-y-2">
            <div className={`h-3 ${shimmer} rounded w-24`} />
            <div className={`h-3 ${shimmer} rounded w-16`} />
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-between items-center pt-2 border-t border-[#ccc3d7]/10">
      <div className={`h-4 ${shimmer} rounded w-24`} />
      <div className={`h-8 ${shimmer} rounded-full w-28`} />
    </div>
  </div>
);
