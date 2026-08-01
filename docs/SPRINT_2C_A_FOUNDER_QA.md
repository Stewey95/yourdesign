# Sprint 2C.A Founder QA — Navigation & Product Continuity

## Homepage

- Confirm **My Products** appears beside **New Product** on desktop.
- Open the mobile menu and confirm both actions are clear, contained and reachable.
- Select **My Products** and confirm it opens Product Studio.

## Product Studio — empty state

- Test in a browser profile with no local products.
- Confirm the empty state explains that no products exist and offers **Create your first product**.
- Confirm the on-device storage message is visible and accurate.
- Create a product and confirm there is no dead end.

## Product Studio — existing products

- Confirm **Continue Creating** displays the most recently edited product first.
- Confirm the product type, status, page count, last-edited page and thumbnail are correct.
- Select **Continue Editing** and confirm the correct page opens in Focus Studio.
- Select **View product** and confirm the correct Product Studio workspace opens.
- Confirm remaining products appear under **More products** in recency order.

## Navigation continuity

- Follow: Homepage → My Products → Product Studio → Continue Editing → Focus Studio.
- In Focus Studio, use **Back to Product Studio** and confirm the correct product opens.
- From the product workspace, use **Your products** and confirm the dashboard opens.
- Confirm the Gripix logo returns home from Product Studio and Focus Studio.

## Responsive and browser coverage

- Repeat changed flows in Chrome desktop and Safari desktop.
- Repeat changed flows at 390px in responsive Chrome and Safari.
- Confirm there is no horizontal document overflow, clipped copy or inaccessible action.
