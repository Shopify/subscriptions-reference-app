// @ts-nocheck
(() => {
  const hiddenClass = 'shopify_subscriptions_app_block--hidden';

  class ShopifySubscriptionsWidget {
    constructor(subscriptionWidgetContainer) {
      this.listenToOpenQuickAddModal();

      if (this.openQuickAddModal) {
        this.enableCartAddPerformanceObserver();
        this.hideShopifyWidget();
        return;
      }

      this.enableVariantPerformanceObserver();

      this.subscriptionWidgetContainer = subscriptionWidgetContainer;
      this.appendSellingPlanInputs();
      this.updateSellingPlanInputsValues();
      this.listenToVariantChange();
      this.listenToSellingPlanFormRadioButtonChange();

      if (!(this.regularPriceElement && this.salePriceElement)) {
        this.updatePrice = this.updateWidgetPrice;
        this.showInWidgetPriceElements();
        return;
      }
      this.updatePrice = this.updateThemePrice;
      this.updatePrice();
    }

    get inWidgetPriceElements() {
      return this.shopifySection.querySelectorAll(
        '.shopify_subscriptions_in_widget_price',
      );
    }

    showInWidgetPriceElements() {
      this.inWidgetPriceElements.forEach((inWidgetPriceElement) =>
        inWidgetPriceElement.classList.remove(hiddenClass),
      );
    }

    get sectionId() {
      return this.subscriptionWidgetContainer.getAttribute('data-section-id');
    }

    get shopifySection() {
      return document.querySelector(`#shopify-section-${this.sectionId}`);
    }

    get variantIdInput() {
      return (
        this.addToCartForms[1]?.querySelector(`input[name="id"]`) ||
        this.addToCartForms[1]?.querySelector(`select[name="id"]`) ||
        this.addToCartForms[0].querySelector(`input[name="id"]`) ||
        this.addToCartForms[0].querySelector(`select[name="id"]`)
      );
    }

    get priceElement() {
      return this.shopifySection.querySelector('.price');
    }

    get comparedAtPrice() {
      return this.shopifySection.querySelector('.price__sale');
    }

    get visibleSellingPlanForm() {
      return this.shopifySection.querySelector(
        `section[data-variant-id^="${this.variantIdInput.value}"]`,
      );
    }

    get isVariantDisabled() {
      return this.selectedPurchaseOption
        .getAttributeNames()
        .includes('disabled');
    }

    get sellingPlanInput() {
      return this.shopifySection.querySelector('.selected-selling-plan-id');
    }

    get addToCartForms() {
      return this.shopifySection.querySelectorAll('[action*="/cart/add"]');
    }

    appendSellingPlanInputs() {
      this.addToCartForms.forEach((addToCartForm) => {
        addToCartForm.appendChild(this.sellingPlanInput.cloneNode());
      });
    }

    showSellingPlanForm(sellingPlanFormForSelectedVariant) {
      sellingPlanFormForSelectedVariant?.classList?.remove(hiddenClass);
    }

    hideSellingPlanForms(sellingPlanFormsForUnselectedVariants) {
      sellingPlanFormsForUnselectedVariants.forEach((element) => {
        element.classList.add(hiddenClass);
      });
    }

    handleSellingPlanFormVisibility() {
      const sellingPlanFormForSelectedVariant =
        this.shopifySection.querySelector(
          `section[data-variant-id="${this.variantIdInput.value}"]`,
        );
      const sellingPlanFormsForUnselectedVariants =
        this.shopifySection.querySelectorAll(
          `.shopify_subscriptions_app_block:not([data-variant-id="${this.variantIdInput.value}"])`,
        );
      this.showSellingPlanForm(sellingPlanFormForSelectedVariant);
      this.hideSellingPlanForms(sellingPlanFormsForUnselectedVariants);
    }

    handleVariantChange() {
      this.handleSellingPlanFormVisibility();
      this.updateSellingPlanInputsValues();
      this.listenToSellingPlanFormRadioButtonChange();
    }

    listenToVariantChange() {
      this.listenToAddToCartForms();
      if (this.variantIdInput.tagName === 'INPUT') {
        const variantIdObserver = new MutationObserver((mutationList) => {
          mutationList.forEach((mutationRecord) => {
            this.handleVariantChange(mutationRecord.target.value);
          });
        });

        variantIdObserver.observe(this.variantIdInput, {
          attributes: true,
        });
      }
    }

    listenToAddToCartForms() {
      this.addToCartForms.forEach((addToCartForm) => {
        addToCartForm.addEventListener('change', () => {
          this.handleVariantChange();
        });
      });
    }

    get salesBadge() {
      return this.shopifySection.querySelector('.badge.price__badge-sale');
    }

    get subscriptionsBadge() {
      return (
        this.shopifySection.querySelector('.price__badge--subscription') ??
        this.cloneSalesBadge()
      );
    }

    cloneSalesBadge() {
      const subscriptionsBadgeText = document.getElementById(
        'subscriptions_badge_text',
      ).innerHTML;
      const salesBadgeClone = this.salesBadge.cloneNode(true);
      salesBadgeClone.classList.add('price__badge--subscription');
      salesBadgeClone.innerHTML = subscriptionsBadgeText;
      this.salesBadge.parentNode.appendChild(salesBadgeClone);
      return salesBadgeClone;
    }

    setBadgeType(badge) {
      this.subscriptionsBadge.style.display =
        badge === 'subscription' ? 'inline-block' : 'none';
      this.salesBadge.style.display =
        badge === 'sale' ? 'inline-block' : 'none';
    }

    get regularPriceElement() {
      return this.shopifySection.querySelector('.price__regular');
    }

    get salePriceElement() {
      return this.shopifySection.querySelector('.price__sale');
    }

    get salePriceValue() {
      return this.salePriceElement.querySelector('.price-item--sale');
    }

    get regularPriceValue() {
      return this.salePriceElement.querySelector('.price-item--regular');
    }

    get sellingPlanAllocationPrice() {
      if (!this.selectedPurchaseOption) return null;
      return document.getElementById(
        `${this.selectedPurchaseOption.dataset.sellingPlanGroupId}_allocation_price`,
      );
    }

    get selectedPurchaseOptionPrice() {
      return this.selectedPurchaseOption.dataset.variantPrice;
    }

    get selectedPurchaseOptionComparedAtPrice() {
      return this.selectedPurchaseOption.dataset.variantCompareAtPrice;
    }

    get price() {
      return this.sellingPlanAllocationPrices.price ?? null;
    }

    get hasPriceComparison() {
      return (
        this.selectedPurchaseOptionComparedAtPrice &&
        this.selectedPurchaseOptionComparedAtPrice !==
          this.selectedPurchaseOptionPrice
      );
    }

    get discounted() {
      return (
        this.hasPriceComparison &&
        this.selectedPurchaseOptionComparedAtPrice >
          this.selectedPurchaseOptionPrice
      );
    }

    updateThemePrice() {
      if (!this.selectedPurchaseOption) return;
      const sellingPlanAdjustment =
        this.selectedPurchaseOption.dataset.sellingPlanAdjustment;

      if (this.hasPriceComparison) {
        this.showSalePrice();
        this.hideRegularPrice();
        this.priceElement.classList.add('price--on-sale');
      } else {
        this.showRegularPrice();
        this.hideSalePrice();
        this.priceElement.classList.remove('price--on-sale');
      }

      if (this.salesBadge) {
        this.setBadgeValue(sellingPlanAdjustment);
      }
    }

    updateWidgetPrice() {
      if (this.sellingPlanAllocationPrice) {
        this.sellingPlanAllocationPrice.innerHTML =
          this.selectedPurchaseOptionPrice;
      }
    }

    hideSalePrice() {
      this.salePriceElement.style.display = 'none';
    }

    hideRegularPrice() {
      this.regularPriceElement.style.display = 'none';
    }

    showRegularPrice() {
      this.regularPriceElement.style.display = 'block';
      this.shopifySection.querySelector('.price__sale').style.display = 'none';
    }

    showSalePrice() {
      this.salePriceElement.style.display = 'block';
      this.regularPriceValue.innerHTML =
        this.selectedPurchaseOptionComparedAtPrice;
      this.salePriceValue.innerHTML = this.selectedPurchaseOptionPrice;
    }

    setBadgeValue(sellingPlanAdjustment) {
      let badge = 'none';

      // If the variant is disabled, we hide the badge so it doesn't conflict with the 'Out of Stock' badge
      if (!this.isVariantDisabled) {
        if (sellingPlanAdjustment) {
          badge = 'subscription';
        } else if (this.discounted) {
          badge = 'sale';
        }
      }

      this.setBadgeType(badge);
    }

    get sellingPlanInputs() {
      return this.shopifySection.querySelectorAll('.selected-selling-plan-id');
    }

    updateSellingPlanInputsValues() {
      this.sellingPlanInputs.forEach((sellingPlanInput) => {
        sellingPlanInput.value = this.sellingPlanInputValue;
      });
    }

    get sellingPlanInputValue() {
      return this.selectedPurchaseOption?.dataset.sellingPlanId ?? null;
    }

    get selectedPurchaseOption() {
      return this.visibleSellingPlanForm?.querySelector(
        'input[type="radio"]:checked',
      );
    }

    set selectedPurchaseOption(selectedPurchaseOption) {
      this._selectedPurchaseOption = selectedPurchaseOption;
    }

    handleRadioButtonChange(selectedPurchaseOption) {
      this.selectedPurchaseOption = selectedPurchaseOption;
      this.updateSellingPlanInputsValues();
      this.updatePrice();
    }

    listenToSellingPlanFormRadioButtonChange() {
      this.visibleSellingPlanForm
        ?.querySelectorAll('input[type="radio"]')
        .forEach((radio) => {
          radio.addEventListener('change', (e) => {
            this.handleRadioButtonChange(e.target);
          });
        });
    }

    get shopifyBlocks() {
      return this.openQuickAddModal?.querySelectorAll('.shopify-block');
    }

    hideShopifyWidget() {
      this.shopifyBlocks?.forEach((element) => {
        element.classList.add(hiddenClass);
      });
    }

    get quickAddModals() {
      return Array.from(
        document.querySelectorAll('.quick-add-modal__content-info'),
      );
    }

    get openQuickAddModal() {
      return this.quickAddModals.find((quickAddModal) =>
        quickAddModal.hasChildNodes(),
      );
    }

    get errorMessageElements() {
      return this.openQuickAddModal?.querySelectorAll(
        '.product-form__error-message',
      );
    }

    get quickAddErrorMessage() {
      return document.querySelector(
        '#shopify_subscriptions_app_block_error_message',
      );
    }

    toggleQuickAddErrorMessage() {
      this.errorMessageElements?.forEach((errorMessageElement) => {
        this.quickAddErrorMessage.classList.remove(hiddenClass);
        errorMessageElement.replaceWith(this.quickAddErrorMessage);
      });
    }

    enableVariantPerformanceObserver() {
      const variantPerformanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.initiatorType !== 'fetch') return;

          const url = new URL(entry.name);
          // When the variant changes, the price is updated via a fetch request - update the price to reflect the selected selling plan price
          if (
            url.search.includes('variant') ||
            url.search.includes('variants')
          ) {
            this.updatePrice();
          }
          // When clicking "Add to cart", update the selling-plans-only error message for the quick add modal
          if (url.pathname.includes('/cart/add'))
            this.toggleQuickAddErrorMessage();
        });

        variantPerformanceObserver.observe({entryTypes: ['resource']});
      });
    }

    enableCartAddPerformanceObserver() {
      const cartAddperformanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.initiatorType !== 'fetch') return;

          const url = new URL(entry.name);

          // When clicking "Add to cart", update the selling-plans-only error message for the quick add modal
          if (url.pathname.includes('/cart/add'))
            this.toggleQuickAddErrorMessage();
        });
      });

      cartAddperformanceObserver.observe({entryTypes: ['resource']});
    }

    listenToOpenQuickAddModal() {
      const quickAddModalObserver = new MutationObserver((mutationList) => {
        mutationList.forEach(() => {
          this.hideShopifyWidget();
        });
      });

      this.quickAddModals.forEach((quickAddModal) => {
        quickAddModalObserver.observe(quickAddModal, {
          childList: true,
        });
      });
    }
  }

  document
    .querySelectorAll('.shopify_subscriptions_app_container')
    .forEach((subscriptionWidgetContainer) => {
      new ShopifySubscriptionsWidget(subscriptionWidgetContainer);
    });
})();
