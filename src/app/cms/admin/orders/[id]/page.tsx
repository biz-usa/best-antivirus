
import { notFound } from "next/navigation";
import { getAdminOrderById, getAdminProductById } from "@/lib/admin-data";
import type { OrderItem, Product, Order, ProductVariant } from "@/lib/types";
import { OrderDetailsClient } from "./_components/order-details-client";
import { serializeForClient } from "@/lib/serializeForClient";


type OrderItemWithDetails = OrderItem & { variant: ProductVariant | null };

type Props = {
  params: Promise<{ id: string }>
}

async function getOrderWithFullDetails(orderId: string): Promise<{ order: Order, itemsWithDetails: OrderItemWithDetails[] } | null> {
    const order = await getAdminOrderById(orderId);
    if (!order) {
        return null;
    }

    const itemsWithDetails: OrderItemWithDetails[] = await Promise.all(
        order.items.map(async (item) => {
            const product = await getAdminProductById(item.id);
            const variant = product?.variants.find(v => v.id === item.variantId) || null;
            return { ...item, variant };
        })
    );

    return { order, itemsWithDetails };
}

export default async function OrderDetailsPage({ params }: Props) {
  const { id } = await params;
  const rawData = await getOrderWithFullDetails(id);

  if (!rawData) {
    notFound();
  }

  const { order, itemsWithDetails } = serializeForClient(rawData);

  return (
    <OrderDetailsClient order={order} itemsWithDetails={itemsWithDetails} />
  );
}
