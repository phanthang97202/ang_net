import {
  MenuService,
  NzIsMenuInsideDropDownToken,
  NzMenuModule
} from "./chunk-FWDAQJWN.js";
import {
  NzButtonGroupComponent
} from "./chunk-UGNKMPV2.js";
import {
  NzNoAnimationDirective
} from "./chunk-G7J4JRBG.js";
import {
  POSITION_MAP
} from "./chunk-SICV6C2E.js";
import {
  ConnectionPositionPair,
  Overlay,
  TemplatePortal
} from "./chunk-SALCKB7V.js";
import "./chunk-KUHH5VSN.js";
import "./chunk-EGL5JPSY.js";
import {
  ESCAPE,
  hasModifierKey
} from "./chunk-PSAR3ULL.js";
import "./chunk-QJ2M2TXZ.js";
import "./chunk-I2VQEMK5.js";
import {
  ActivatedRoute,
  NavigationEnd,
  PRIMARY_OUTLET,
  Router
} from "./chunk-LJZ3HH2U.js";
import {
  slideMotion
} from "./chunk-2FJ73CTG.js";
import "./chunk-RR2LUTDB.js";
import {
  NzIconDirective,
  NzIconModule
} from "./chunk-RSJKC5JJ.js";
import {
  NzOutletModule,
  NzStringTemplateOutletDirective
} from "./chunk-7N6KPSRX.js";
import {
  Directionality
} from "./chunk-X2MXUJWV.js";
import {
  Platform
} from "./chunk-HHLWLUKF.js";
import {
  NzConfigService,
  WithConfig
} from "./chunk-YHLYEO5J.js";
import {
  InputBoolean,
  PREFIX
} from "./chunk-ITQGD2IW.js";
import "./chunk-LLN4J7CV.js";
import "./chunk-2H4K2YJN.js";
import {
  NgClass,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-UKOICS42.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  Host,
  Injectable,
  Injector,
  Input,
  NgModule,
  NgZone,
  Optional,
  Output,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation$1,
  setClassMetadata,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵinject,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-HC6PARWB.js";
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  Subscription,
  __decorate,
  auditTime,
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  fromEvent,
  map,
  mapTo,
  merge,
  startWith,
  switchMap,
  takeUntil
} from "./chunk-PCSJ3H3U.js";
import "./chunk-J4B6MK7R.js";

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-dropdown.mjs
var _c0 = ["*"];
function NzDropdownMenuComponent_ng_template_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 0);
    ɵɵlistener("@slideMotion.done", function NzDropdownMenuComponent_ng_template_0_Template_div_animation_slideMotion_done_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onAnimationEvent($event));
    })("mouseenter", function NzDropdownMenuComponent_ng_template_0_Template_div_mouseenter_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.setMouseState(true));
    })("mouseleave", function NzDropdownMenuComponent_ng_template_0_Template_div_mouseleave_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.setMouseState(false));
    });
    ɵɵprojection(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassProp("ant-dropdown-rtl", ctx_r1.dir === "rtl");
    ɵɵproperty("ngClass", ctx_r1.nzOverlayClassName)("ngStyle", ctx_r1.nzOverlayStyle)("@slideMotion", void 0)("@.disabled", !!(ctx_r1.noAnimation == null ? null : ctx_r1.noAnimation.nzNoAnimation))("nzNoAnimation", ctx_r1.noAnimation == null ? null : ctx_r1.noAnimation.nzNoAnimation);
  }
}
var NZ_CONFIG_MODULE_NAME = "dropDown";
var listOfPositions = [POSITION_MAP.bottomLeft, POSITION_MAP.bottomRight, POSITION_MAP.topRight, POSITION_MAP.topLeft];
var _NzDropDownDirective = class _NzDropDownDirective {
  setDropdownMenuValue(key, value) {
    if (this.nzDropdownMenu) {
      this.nzDropdownMenu.setValue(key, value);
    }
  }
  constructor(nzConfigService, elementRef, overlay, renderer, viewContainerRef, platform) {
    this.nzConfigService = nzConfigService;
    this.elementRef = elementRef;
    this.overlay = overlay;
    this.renderer = renderer;
    this.viewContainerRef = viewContainerRef;
    this.platform = platform;
    this._nzModuleName = NZ_CONFIG_MODULE_NAME;
    this.overlayRef = null;
    this.destroy$ = new Subject();
    this.positionStrategy = this.overlay.position().flexibleConnectedTo(this.elementRef.nativeElement).withLockedPosition().withTransformOriginOn(".ant-dropdown");
    this.inputVisible$ = new BehaviorSubject(false);
    this.nzTrigger$ = new BehaviorSubject("hover");
    this.overlayClose$ = new Subject();
    this.nzDropdownMenu = null;
    this.nzTrigger = "hover";
    this.nzMatchWidthElement = null;
    this.nzBackdrop = false;
    this.nzClickHide = true;
    this.nzDisabled = false;
    this.nzVisible = false;
    this.nzOverlayClassName = "";
    this.nzOverlayStyle = {};
    this.nzPlacement = "bottomLeft";
    this.nzVisibleChange = new EventEmitter();
  }
  ngAfterViewInit() {
    if (this.nzDropdownMenu) {
      const nativeElement = this.elementRef.nativeElement;
      const hostMouseState$ = merge(fromEvent(nativeElement, "mouseenter").pipe(mapTo(true)), fromEvent(nativeElement, "mouseleave").pipe(mapTo(false)));
      const menuMouseState$ = this.nzDropdownMenu.mouseState$;
      const mergedMouseState$ = merge(menuMouseState$, hostMouseState$);
      const hostClickState$ = fromEvent(nativeElement, "click").pipe(map(() => !this.nzVisible));
      const visibleStateByTrigger$ = this.nzTrigger$.pipe(switchMap((trigger) => {
        if (trigger === "hover") {
          return mergedMouseState$;
        } else if (trigger === "click") {
          return hostClickState$;
        } else {
          return EMPTY;
        }
      }));
      const descendantMenuItemClick$ = this.nzDropdownMenu.descendantMenuItemClick$.pipe(filter(() => this.nzClickHide), mapTo(false));
      const domTriggerVisible$ = merge(visibleStateByTrigger$, descendantMenuItemClick$, this.overlayClose$).pipe(filter(() => !this.nzDisabled));
      const visible$ = merge(this.inputVisible$, domTriggerVisible$);
      combineLatest([visible$, this.nzDropdownMenu.isChildSubMenuOpen$]).pipe(map(([visible, sub]) => visible || sub), auditTime(150), distinctUntilChanged(), filter(() => this.platform.isBrowser), takeUntil(this.destroy$)).subscribe((visible) => {
        const element = this.nzMatchWidthElement ? this.nzMatchWidthElement.nativeElement : nativeElement;
        const triggerWidth = element.getBoundingClientRect().width;
        if (this.nzVisible !== visible) {
          this.nzVisibleChange.emit(visible);
        }
        this.nzVisible = visible;
        if (visible) {
          if (!this.overlayRef) {
            this.overlayRef = this.overlay.create({
              positionStrategy: this.positionStrategy,
              minWidth: triggerWidth,
              disposeOnNavigation: true,
              hasBackdrop: this.nzBackdrop && this.nzTrigger === "click",
              scrollStrategy: this.overlay.scrollStrategies.reposition()
            });
            merge(this.overlayRef.backdropClick(), this.overlayRef.detachments(), this.overlayRef.outsidePointerEvents().pipe(filter((e) => !this.elementRef.nativeElement.contains(e.target))), this.overlayRef.keydownEvents().pipe(filter((e) => e.keyCode === ESCAPE && !hasModifierKey(e)))).pipe(takeUntil(this.destroy$)).subscribe(() => {
              this.overlayClose$.next(false);
            });
          } else {
            const overlayConfig = this.overlayRef.getConfig();
            overlayConfig.minWidth = triggerWidth;
          }
          this.positionStrategy.withPositions([POSITION_MAP[this.nzPlacement], ...listOfPositions]);
          if (!this.portal || this.portal.templateRef !== this.nzDropdownMenu.templateRef) {
            this.portal = new TemplatePortal(this.nzDropdownMenu.templateRef, this.viewContainerRef);
          }
          this.overlayRef.attach(this.portal);
        } else {
          if (this.overlayRef) {
            this.overlayRef.detach();
          }
        }
      });
      this.nzDropdownMenu.animationStateChange$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        if (event.toState === "void") {
          if (this.overlayRef) {
            this.overlayRef.dispose();
          }
          this.overlayRef = null;
        }
      });
    }
  }
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  ngOnChanges(changes) {
    const {
      nzVisible,
      nzDisabled,
      nzOverlayClassName,
      nzOverlayStyle,
      nzTrigger
    } = changes;
    if (nzTrigger) {
      this.nzTrigger$.next(this.nzTrigger);
    }
    if (nzVisible) {
      this.inputVisible$.next(this.nzVisible);
    }
    if (nzDisabled) {
      const nativeElement = this.elementRef.nativeElement;
      if (this.nzDisabled) {
        this.renderer.setAttribute(nativeElement, "disabled", "");
        this.inputVisible$.next(false);
      } else {
        this.renderer.removeAttribute(nativeElement, "disabled");
      }
    }
    if (nzOverlayClassName) {
      this.setDropdownMenuValue("nzOverlayClassName", this.nzOverlayClassName);
    }
    if (nzOverlayStyle) {
      this.setDropdownMenuValue("nzOverlayStyle", this.nzOverlayStyle);
    }
  }
};
_NzDropDownDirective.ɵfac = function NzDropDownDirective_Factory(t) {
  return new (t || _NzDropDownDirective)(ɵɵdirectiveInject(NzConfigService), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Overlay), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(Platform));
};
_NzDropDownDirective.ɵdir = ɵɵdefineDirective({
  type: _NzDropDownDirective,
  selectors: [["", "nz-dropdown", ""]],
  hostAttrs: [1, "ant-dropdown-trigger"],
  inputs: {
    nzDropdownMenu: "nzDropdownMenu",
    nzTrigger: "nzTrigger",
    nzMatchWidthElement: "nzMatchWidthElement",
    nzBackdrop: "nzBackdrop",
    nzClickHide: "nzClickHide",
    nzDisabled: "nzDisabled",
    nzVisible: "nzVisible",
    nzOverlayClassName: "nzOverlayClassName",
    nzOverlayStyle: "nzOverlayStyle",
    nzPlacement: "nzPlacement"
  },
  outputs: {
    nzVisibleChange: "nzVisibleChange"
  },
  exportAs: ["nzDropdown"],
  standalone: true,
  features: [ɵɵNgOnChangesFeature]
});
var NzDropDownDirective = _NzDropDownDirective;
__decorate([WithConfig(), InputBoolean()], NzDropDownDirective.prototype, "nzBackdrop", void 0);
__decorate([InputBoolean()], NzDropDownDirective.prototype, "nzClickHide", void 0);
__decorate([InputBoolean()], NzDropDownDirective.prototype, "nzDisabled", void 0);
__decorate([InputBoolean()], NzDropDownDirective.prototype, "nzVisible", void 0);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzDropDownDirective, [{
    type: Directive,
    args: [{
      selector: "[nz-dropdown]",
      exportAs: "nzDropdown",
      host: {
        class: "ant-dropdown-trigger"
      },
      standalone: true
    }]
  }], () => [{
    type: NzConfigService
  }, {
    type: ElementRef
  }, {
    type: Overlay
  }, {
    type: Renderer2
  }, {
    type: ViewContainerRef
  }, {
    type: Platform
  }], {
    nzDropdownMenu: [{
      type: Input
    }],
    nzTrigger: [{
      type: Input
    }],
    nzMatchWidthElement: [{
      type: Input
    }],
    nzBackdrop: [{
      type: Input
    }],
    nzClickHide: [{
      type: Input
    }],
    nzDisabled: [{
      type: Input
    }],
    nzVisible: [{
      type: Input
    }],
    nzOverlayClassName: [{
      type: Input
    }],
    nzOverlayStyle: [{
      type: Input
    }],
    nzPlacement: [{
      type: Input
    }],
    nzVisibleChange: [{
      type: Output
    }]
  });
})();
var _NzContextMenuServiceModule = class _NzContextMenuServiceModule {
};
_NzContextMenuServiceModule.ɵfac = function NzContextMenuServiceModule_Factory(t) {
  return new (t || _NzContextMenuServiceModule)();
};
_NzContextMenuServiceModule.ɵmod = ɵɵdefineNgModule({
  type: _NzContextMenuServiceModule
});
_NzContextMenuServiceModule.ɵinj = ɵɵdefineInjector({});
var NzContextMenuServiceModule = _NzContextMenuServiceModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzContextMenuServiceModule, [{
    type: NgModule
  }], null, null);
})();
var _NzDropDownADirective = class _NzDropDownADirective {
  constructor() {
  }
};
_NzDropDownADirective.ɵfac = function NzDropDownADirective_Factory(t) {
  return new (t || _NzDropDownADirective)();
};
_NzDropDownADirective.ɵdir = ɵɵdefineDirective({
  type: _NzDropDownADirective,
  selectors: [["a", "nz-dropdown", ""]],
  hostAttrs: [1, "ant-dropdown-link"],
  standalone: true
});
var NzDropDownADirective = _NzDropDownADirective;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzDropDownADirective, [{
    type: Directive,
    args: [{
      selector: "a[nz-dropdown]",
      host: {
        class: "ant-dropdown-link"
      },
      standalone: true
    }]
  }], () => [], null);
})();
var _NzDropdownButtonDirective = class _NzDropdownButtonDirective {
  constructor(renderer, nzButtonGroupComponent, elementRef) {
    this.renderer = renderer;
    this.nzButtonGroupComponent = nzButtonGroupComponent;
    this.elementRef = elementRef;
  }
  ngAfterViewInit() {
    const parentElement = this.renderer.parentNode(this.elementRef.nativeElement);
    if (this.nzButtonGroupComponent && parentElement) {
      this.renderer.addClass(parentElement, "ant-dropdown-button");
    }
  }
};
_NzDropdownButtonDirective.ɵfac = function NzDropdownButtonDirective_Factory(t) {
  return new (t || _NzDropdownButtonDirective)(ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(NzButtonGroupComponent, 9), ɵɵdirectiveInject(ElementRef));
};
_NzDropdownButtonDirective.ɵdir = ɵɵdefineDirective({
  type: _NzDropdownButtonDirective,
  selectors: [["", "nz-button", "", "nz-dropdown", ""]],
  standalone: true
});
var NzDropdownButtonDirective = _NzDropdownButtonDirective;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzDropdownButtonDirective, [{
    type: Directive,
    args: [{
      selector: "[nz-button][nz-dropdown]",
      standalone: true
    }]
  }], () => [{
    type: Renderer2
  }, {
    type: NzButtonGroupComponent,
    decorators: [{
      type: Host
    }, {
      type: Optional
    }]
  }, {
    type: ElementRef
  }], null);
})();
var _NzDropdownMenuComponent = class _NzDropdownMenuComponent {
  onAnimationEvent(event) {
    this.animationStateChange$.emit(event);
  }
  setMouseState(visible) {
    this.mouseState$.next(visible);
  }
  setValue(key, value) {
    this[key] = value;
    this.cdr.markForCheck();
  }
  constructor(cdr, elementRef, renderer, viewContainerRef, nzMenuService, directionality, noAnimation) {
    this.cdr = cdr;
    this.elementRef = elementRef;
    this.renderer = renderer;
    this.viewContainerRef = viewContainerRef;
    this.nzMenuService = nzMenuService;
    this.directionality = directionality;
    this.noAnimation = noAnimation;
    this.mouseState$ = new BehaviorSubject(false);
    this.isChildSubMenuOpen$ = this.nzMenuService.isChildSubMenuOpen$;
    this.descendantMenuItemClick$ = this.nzMenuService.descendantMenuItemClick$;
    this.animationStateChange$ = new EventEmitter();
    this.nzOverlayClassName = "";
    this.nzOverlayStyle = {};
    this.dir = "ltr";
    this.destroy$ = new Subject();
  }
  ngOnInit() {
    this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction) => {
      this.dir = direction;
      this.cdr.detectChanges();
    });
    this.dir = this.directionality.value;
  }
  ngAfterContentInit() {
    this.renderer.removeChild(this.renderer.parentNode(this.elementRef.nativeElement), this.elementRef.nativeElement);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
};
_NzDropdownMenuComponent.ɵfac = function NzDropdownMenuComponent_Factory(t) {
  return new (t || _NzDropdownMenuComponent)(ɵɵdirectiveInject(ChangeDetectorRef), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(MenuService), ɵɵdirectiveInject(Directionality, 8), ɵɵdirectiveInject(NzNoAnimationDirective, 9));
};
_NzDropdownMenuComponent.ɵcmp = ɵɵdefineComponent({
  type: _NzDropdownMenuComponent,
  selectors: [["nz-dropdown-menu"]],
  viewQuery: function NzDropdownMenuComponent_Query(rf, ctx) {
    if (rf & 1) {
      ɵɵviewQuery(TemplateRef, 7);
    }
    if (rf & 2) {
      let _t;
      ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templateRef = _t.first);
    }
  },
  exportAs: ["nzDropdownMenu"],
  standalone: true,
  features: [ɵɵProvidersFeature([
    MenuService,
    /** menu is inside dropdown-menu component **/
    {
      provide: NzIsMenuInsideDropDownToken,
      useValue: true
    }
  ]), ɵɵStandaloneFeature],
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  consts: [[1, "ant-dropdown", 3, "mouseenter", "mouseleave", "ngClass", "ngStyle", "nzNoAnimation"]],
  template: function NzDropdownMenuComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef();
      ɵɵtemplate(0, NzDropdownMenuComponent_ng_template_0_Template, 2, 7, "ng-template");
    }
  },
  dependencies: [NgClass, NgStyle, NzNoAnimationDirective],
  encapsulation: 2,
  data: {
    animation: [slideMotion]
  },
  changeDetection: 0
});
var NzDropdownMenuComponent = _NzDropdownMenuComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzDropdownMenuComponent, [{
    type: Component,
    args: [{
      selector: `nz-dropdown-menu`,
      exportAs: `nzDropdownMenu`,
      animations: [slideMotion],
      providers: [
        MenuService,
        /** menu is inside dropdown-menu component **/
        {
          provide: NzIsMenuInsideDropDownToken,
          useValue: true
        }
      ],
      template: `
    <ng-template>
      <div
        class="ant-dropdown"
        [class.ant-dropdown-rtl]="dir === 'rtl'"
        [ngClass]="nzOverlayClassName"
        [ngStyle]="nzOverlayStyle"
        @slideMotion
        (@slideMotion.done)="onAnimationEvent($event)"
        [@.disabled]="!!noAnimation?.nzNoAnimation"
        [nzNoAnimation]="noAnimation?.nzNoAnimation"
        (mouseenter)="setMouseState(true)"
        (mouseleave)="setMouseState(false)"
      >
        <ng-content></ng-content>
      </div>
    </ng-template>
  `,
      preserveWhitespaces: false,
      encapsulation: ViewEncapsulation$1.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgClass, NgStyle, NzNoAnimationDirective],
      standalone: true
    }]
  }], () => [{
    type: ChangeDetectorRef
  }, {
    type: ElementRef
  }, {
    type: Renderer2
  }, {
    type: ViewContainerRef
  }, {
    type: MenuService
  }, {
    type: Directionality,
    decorators: [{
      type: Optional
    }]
  }, {
    type: NzNoAnimationDirective,
    decorators: [{
      type: Host
    }, {
      type: Optional
    }]
  }], {
    templateRef: [{
      type: ViewChild,
      args: [TemplateRef, {
        static: true
      }]
    }]
  });
})();
var _NzDropDownModule = class _NzDropDownModule {
};
_NzDropDownModule.ɵfac = function NzDropDownModule_Factory(t) {
  return new (t || _NzDropDownModule)();
};
_NzDropDownModule.ɵmod = ɵɵdefineNgModule({
  type: _NzDropDownModule,
  imports: [NzDropDownDirective, NzDropDownADirective, NzDropdownMenuComponent, NzDropdownButtonDirective, NzContextMenuServiceModule],
  exports: [NzMenuModule, NzDropDownDirective, NzDropDownADirective, NzDropdownMenuComponent, NzDropdownButtonDirective]
});
_NzDropDownModule.ɵinj = ɵɵdefineInjector({
  imports: [NzContextMenuServiceModule, NzMenuModule]
});
var NzDropDownModule = _NzDropDownModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzDropDownModule, [{
    type: NgModule,
    args: [{
      imports: [NzDropDownDirective, NzDropDownADirective, NzDropdownMenuComponent, NzDropdownButtonDirective, NzContextMenuServiceModule],
      exports: [NzMenuModule, NzDropDownDirective, NzDropDownADirective, NzDropdownMenuComponent, NzDropdownButtonDirective]
    }]
  }], null, null);
})();
var LIST_OF_POSITIONS = [new ConnectionPositionPair({
  originX: "start",
  originY: "top"
}, {
  overlayX: "start",
  overlayY: "top"
}), new ConnectionPositionPair({
  originX: "start",
  originY: "top"
}, {
  overlayX: "start",
  overlayY: "bottom"
}), new ConnectionPositionPair({
  originX: "start",
  originY: "top"
}, {
  overlayX: "end",
  overlayY: "bottom"
}), new ConnectionPositionPair({
  originX: "start",
  originY: "top"
}, {
  overlayX: "end",
  overlayY: "top"
})];
var _NzContextMenuService = class _NzContextMenuService {
  constructor(ngZone, overlay) {
    this.ngZone = ngZone;
    this.overlay = overlay;
    this.overlayRef = null;
    this.closeSubscription = Subscription.EMPTY;
  }
  create($event, nzDropdownMenuComponent) {
    this.close(true);
    const {
      x,
      y
    } = $event;
    if ($event instanceof MouseEvent) {
      $event.preventDefault();
    }
    const positionStrategy = this.overlay.position().flexibleConnectedTo({
      x,
      y
    }).withPositions(LIST_OF_POSITIONS).withTransformOriginOn(".ant-dropdown");
    this.overlayRef = this.overlay.create({
      positionStrategy,
      disposeOnNavigation: true,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });
    this.closeSubscription = new Subscription();
    this.closeSubscription.add(nzDropdownMenuComponent.descendantMenuItemClick$.subscribe(() => this.close()));
    this.closeSubscription.add(this.ngZone.runOutsideAngular(() => merge(fromEvent(document, "click").pipe(
      filter((event) => !!this.overlayRef && !this.overlayRef.overlayElement.contains(event.target)),
      /** handle firefox contextmenu event **/
      filter((event) => event.button !== 2)
    ), fromEvent(document, "keydown").pipe(filter((event) => event.key === "Escape"))).pipe(first()).subscribe(() => this.ngZone.run(() => this.close()))));
    return this.overlayRef.attach(new TemplatePortal(nzDropdownMenuComponent.templateRef, nzDropdownMenuComponent.viewContainerRef));
  }
  close(clear = false) {
    if (this.overlayRef) {
      this.overlayRef.detach();
      if (clear) {
        this.overlayRef.dispose();
      }
      this.overlayRef = null;
      this.closeSubscription.unsubscribe();
    }
  }
};
_NzContextMenuService.ɵfac = function NzContextMenuService_Factory(t) {
  return new (t || _NzContextMenuService)(ɵɵinject(NgZone), ɵɵinject(Overlay));
};
_NzContextMenuService.ɵprov = ɵɵdefineInjectable({
  token: _NzContextMenuService,
  factory: _NzContextMenuService.ɵfac,
  providedIn: NzContextMenuServiceModule
});
var NzContextMenuService = _NzContextMenuService;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzContextMenuService, [{
    type: Injectable,
    args: [{
      providedIn: NzContextMenuServiceModule
    }]
  }], () => [{
    type: NgZone
  }, {
    type: Overlay
  }], null);
})();

// node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-breadcrumb.mjs
var _c02 = ["*"];
function NzBreadCrumbItemComponent_Conditional_0_ng_template_1_Template(rf, ctx) {
}
function NzBreadCrumbItemComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 1);
    ɵɵtemplate(1, NzBreadCrumbItemComponent_Conditional_0_ng_template_1_Template, 0, 0, "ng-template", 2);
    ɵɵelement(2, "span", 3);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    const noMenuTpl_r2 = ɵɵreference(4);
    ɵɵproperty("nzDropdownMenu", ctx_r0.nzOverlay);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", noMenuTpl_r2);
  }
}
function NzBreadCrumbItemComponent_Conditional_1_ng_template_0_Template(rf, ctx) {
}
function NzBreadCrumbItemComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, NzBreadCrumbItemComponent_Conditional_1_ng_template_0_Template, 0, 0, "ng-template", 2);
  }
  if (rf & 2) {
    ɵɵnextContext();
    const noMenuTpl_r2 = ɵɵreference(4);
    ɵɵproperty("ngTemplateOutlet", noMenuTpl_r2);
  }
}
function NzBreadCrumbItemComponent_Conditional_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r0.nzBreadCrumbComponent.nzSeparator, " ");
  }
}
function NzBreadCrumbItemComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "nz-breadcrumb-separator");
    ɵɵtemplate(1, NzBreadCrumbItemComponent_Conditional_2_ng_container_1_Template, 2, 1, "ng-container", 4);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("nzStringTemplateOutlet", ctx_r0.nzBreadCrumbComponent.nzSeparator);
  }
}
function NzBreadCrumbItemComponent_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 5);
    ɵɵprojection(1);
    ɵɵelementEnd();
  }
}
var _forTrack0 = ($index, $item) => $item.url;
function NzBreadCrumbComponent_Conditional_1_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "nz-breadcrumb-item")(1, "a", 0);
    ɵɵlistener("click", function NzBreadCrumbComponent_Conditional_1_For_1_Template_a_click_1_listener($event) {
      const breadcrumb_r2 = ɵɵrestoreView(_r1).$implicit;
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.navigate(breadcrumb_r2.url, $event));
    });
    ɵɵtext(2);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const breadcrumb_r2 = ctx.$implicit;
    ɵɵadvance();
    ɵɵattribute("href", breadcrumb_r2.url, ɵɵsanitizeUrl);
    ɵɵadvance();
    ɵɵtextInterpolate(breadcrumb_r2.label);
  }
}
function NzBreadCrumbComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵrepeaterCreate(0, NzBreadCrumbComponent_Conditional_1_For_1_Template, 3, 2, "nz-breadcrumb-item", null, _forTrack0);
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵrepeater(ctx_r2.breadcrumbs);
  }
}
var _NzBreadCrumbSeparatorComponent = class _NzBreadCrumbSeparatorComponent {
};
_NzBreadCrumbSeparatorComponent.ɵfac = function NzBreadCrumbSeparatorComponent_Factory(t) {
  return new (t || _NzBreadCrumbSeparatorComponent)();
};
_NzBreadCrumbSeparatorComponent.ɵcmp = ɵɵdefineComponent({
  type: _NzBreadCrumbSeparatorComponent,
  selectors: [["nz-breadcrumb-separator"]],
  hostAttrs: [1, "ant-breadcrumb-separator"],
  exportAs: ["nzBreadcrumbSeparator"],
  standalone: true,
  features: [ɵɵStandaloneFeature],
  ngContentSelectors: _c02,
  decls: 1,
  vars: 0,
  template: function NzBreadCrumbSeparatorComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef();
      ɵɵprojection(0);
    }
  },
  encapsulation: 2
});
var NzBreadCrumbSeparatorComponent = _NzBreadCrumbSeparatorComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzBreadCrumbSeparatorComponent, [{
    type: Component,
    args: [{
      selector: "nz-breadcrumb-separator",
      exportAs: "nzBreadcrumbSeparator",
      standalone: true,
      template: `<ng-content></ng-content>`,
      host: {
        class: "ant-breadcrumb-separator"
      }
    }]
  }], null, null);
})();
var NzBreadcrumb = class {
};
var _NzBreadCrumbItemComponent = class _NzBreadCrumbItemComponent {
  constructor(nzBreadCrumbComponent) {
    this.nzBreadCrumbComponent = nzBreadCrumbComponent;
  }
};
_NzBreadCrumbItemComponent.ɵfac = function NzBreadCrumbItemComponent_Factory(t) {
  return new (t || _NzBreadCrumbItemComponent)(ɵɵdirectiveInject(NzBreadcrumb));
};
_NzBreadCrumbItemComponent.ɵcmp = ɵɵdefineComponent({
  type: _NzBreadCrumbItemComponent,
  selectors: [["nz-breadcrumb-item"]],
  inputs: {
    nzOverlay: "nzOverlay"
  },
  exportAs: ["nzBreadcrumbItem"],
  standalone: true,
  features: [ɵɵStandaloneFeature],
  ngContentSelectors: _c02,
  decls: 5,
  vars: 2,
  consts: [["noMenuTpl", ""], ["nz-dropdown", "", 1, "ant-breadcrumb-overlay-link", 3, "nzDropdownMenu"], [3, "ngTemplateOutlet"], ["nz-icon", "", "nzType", "down"], [4, "nzStringTemplateOutlet"], [1, "ant-breadcrumb-link"]],
  template: function NzBreadCrumbItemComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef();
      ɵɵtemplate(0, NzBreadCrumbItemComponent_Conditional_0_Template, 3, 2, "span", 1)(1, NzBreadCrumbItemComponent_Conditional_1_Template, 1, 1)(2, NzBreadCrumbItemComponent_Conditional_2_Template, 2, 1, "nz-breadcrumb-separator")(3, NzBreadCrumbItemComponent_ng_template_3_Template, 2, 0, "ng-template", null, 0, ɵɵtemplateRefExtractor);
    }
    if (rf & 2) {
      ɵɵconditional(0, !!ctx.nzOverlay ? 0 : 1);
      ɵɵadvance(2);
      ɵɵconditional(2, ctx.nzBreadCrumbComponent.nzSeparator ? 2 : -1);
    }
  },
  dependencies: [NgTemplateOutlet, NzBreadCrumbSeparatorComponent, NzDropDownModule, NzDropDownDirective, NzIconModule, NzIconDirective, NzOutletModule, NzStringTemplateOutletDirective],
  encapsulation: 2,
  changeDetection: 0
});
var NzBreadCrumbItemComponent = _NzBreadCrumbItemComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzBreadCrumbItemComponent, [{
    type: Component,
    args: [{
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      selector: "nz-breadcrumb-item",
      exportAs: "nzBreadcrumbItem",
      preserveWhitespaces: false,
      standalone: true,
      imports: [NgTemplateOutlet, NzBreadCrumbSeparatorComponent, NzDropDownModule, NzIconModule, NzOutletModule],
      template: `
    @if (!!nzOverlay) {
      <span class="ant-breadcrumb-overlay-link" nz-dropdown [nzDropdownMenu]="nzOverlay">
        <ng-template [ngTemplateOutlet]="noMenuTpl"></ng-template>
        <span nz-icon nzType="down"></span>
      </span>
    } @else {
      <ng-template [ngTemplateOutlet]="noMenuTpl" />
    }

    @if (nzBreadCrumbComponent.nzSeparator) {
      <nz-breadcrumb-separator>
        <ng-container *nzStringTemplateOutlet="nzBreadCrumbComponent.nzSeparator">
          {{ nzBreadCrumbComponent.nzSeparator }}
        </ng-container>
      </nz-breadcrumb-separator>
    }

    <ng-template #noMenuTpl>
      <span class="ant-breadcrumb-link">
        <ng-content />
      </span>
    </ng-template>
  `
    }]
  }], () => [{
    type: NzBreadcrumb
  }], {
    nzOverlay: [{
      type: Input
    }]
  });
})();
var _NzBreadCrumbComponent = class _NzBreadCrumbComponent {
  constructor(injector, cdr, elementRef, renderer, directionality) {
    this.injector = injector;
    this.cdr = cdr;
    this.elementRef = elementRef;
    this.renderer = renderer;
    this.directionality = directionality;
    this.nzAutoGenerate = false;
    this.nzSeparator = "/";
    this.nzRouteLabel = "breadcrumb";
    this.nzRouteLabelFn = (label) => label;
    this.breadcrumbs = [];
    this.dir = "ltr";
    this.destroy$ = new Subject();
  }
  ngOnInit() {
    if (this.nzAutoGenerate) {
      this.registerRouterChange();
    }
    this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction) => {
      this.dir = direction;
      this.prepareComponentForRtl();
      this.cdr.detectChanges();
    });
    this.dir = this.directionality.value;
    this.prepareComponentForRtl();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  navigate(url, e) {
    e.preventDefault();
    this.injector.get(Router).navigateByUrl(url);
  }
  registerRouterChange() {
    try {
      const router = this.injector.get(Router);
      const activatedRoute = this.injector.get(ActivatedRoute);
      router.events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
        startWith(true)
        // trigger initial render
      ).subscribe(() => {
        this.breadcrumbs = this.getBreadcrumbs(activatedRoute.root);
        this.cdr.markForCheck();
      });
    } catch (e) {
      throw new Error(`${PREFIX} You should import RouterModule if you want to use 'NzAutoGenerate'.`);
    }
  }
  getBreadcrumbs(route, url = "", breadcrumbs = []) {
    const children = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (const child of children) {
      if (child.outlet === PRIMARY_OUTLET) {
        const routeUrl = child.snapshot.url.map((segment) => segment.path).filter((path) => path).join("/");
        const nextUrl = routeUrl ? `${url}/${routeUrl}` : url;
        const breadcrumbLabel = this.nzRouteLabelFn(child.snapshot.data[this.nzRouteLabel]);
        if (routeUrl && breadcrumbLabel) {
          const breadcrumb = {
            label: breadcrumbLabel,
            params: child.snapshot.params,
            url: nextUrl
          };
          breadcrumbs.push(breadcrumb);
        }
        return this.getBreadcrumbs(child, nextUrl, breadcrumbs);
      }
    }
    return breadcrumbs;
  }
  prepareComponentForRtl() {
    if (this.dir === "rtl") {
      this.renderer.addClass(this.elementRef.nativeElement, "ant-breadcrumb-rtl");
    } else {
      this.renderer.removeClass(this.elementRef.nativeElement, "ant-breadcrumb-rtl");
    }
  }
};
_NzBreadCrumbComponent.ɵfac = function NzBreadCrumbComponent_Factory(t) {
  return new (t || _NzBreadCrumbComponent)(ɵɵdirectiveInject(Injector), ɵɵdirectiveInject(ChangeDetectorRef), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(Directionality, 8));
};
_NzBreadCrumbComponent.ɵcmp = ɵɵdefineComponent({
  type: _NzBreadCrumbComponent,
  selectors: [["nz-breadcrumb"]],
  hostAttrs: [1, "ant-breadcrumb"],
  inputs: {
    nzAutoGenerate: "nzAutoGenerate",
    nzSeparator: "nzSeparator",
    nzRouteLabel: "nzRouteLabel",
    nzRouteLabelFn: "nzRouteLabelFn"
  },
  exportAs: ["nzBreadcrumb"],
  standalone: true,
  features: [ɵɵProvidersFeature([{
    provide: NzBreadcrumb,
    useExisting: _NzBreadCrumbComponent
  }]), ɵɵStandaloneFeature],
  ngContentSelectors: _c02,
  decls: 2,
  vars: 1,
  consts: [[3, "click"]],
  template: function NzBreadCrumbComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef();
      ɵɵprojection(0);
      ɵɵtemplate(1, NzBreadCrumbComponent_Conditional_1_Template, 2, 0);
    }
    if (rf & 2) {
      ɵɵadvance();
      ɵɵconditional(1, ctx.nzAutoGenerate && ctx.breadcrumbs.length ? 1 : -1);
    }
  },
  dependencies: [NzBreadCrumbItemComponent],
  encapsulation: 2,
  changeDetection: 0
});
var NzBreadCrumbComponent = _NzBreadCrumbComponent;
__decorate([InputBoolean()], NzBreadCrumbComponent.prototype, "nzAutoGenerate", void 0);
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzBreadCrumbComponent, [{
    type: Component,
    args: [{
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      selector: "nz-breadcrumb",
      exportAs: "nzBreadcrumb",
      preserveWhitespaces: false,
      providers: [{
        provide: NzBreadcrumb,
        useExisting: NzBreadCrumbComponent
      }],
      standalone: true,
      imports: [NzBreadCrumbItemComponent],
      template: `
    <ng-content />
    @if (nzAutoGenerate && breadcrumbs.length) {
      @for (breadcrumb of breadcrumbs; track breadcrumb.url) {
        <nz-breadcrumb-item>
          <a [attr.href]="breadcrumb.url" (click)="navigate(breadcrumb.url, $event)">{{ breadcrumb.label }}</a>
        </nz-breadcrumb-item>
      }
    }
  `,
      host: {
        class: "ant-breadcrumb"
      }
    }]
  }], () => [{
    type: Injector
  }, {
    type: ChangeDetectorRef
  }, {
    type: ElementRef
  }, {
    type: Renderer2
  }, {
    type: Directionality,
    decorators: [{
      type: Optional
    }]
  }], {
    nzAutoGenerate: [{
      type: Input
    }],
    nzSeparator: [{
      type: Input
    }],
    nzRouteLabel: [{
      type: Input
    }],
    nzRouteLabelFn: [{
      type: Input
    }]
  });
})();
var _NzBreadCrumbModule = class _NzBreadCrumbModule {
};
_NzBreadCrumbModule.ɵfac = function NzBreadCrumbModule_Factory(t) {
  return new (t || _NzBreadCrumbModule)();
};
_NzBreadCrumbModule.ɵmod = ɵɵdefineNgModule({
  type: _NzBreadCrumbModule,
  imports: [NzBreadCrumbComponent, NzBreadCrumbItemComponent, NzBreadCrumbSeparatorComponent],
  exports: [NzBreadCrumbComponent, NzBreadCrumbItemComponent, NzBreadCrumbSeparatorComponent]
});
_NzBreadCrumbModule.ɵinj = ɵɵdefineInjector({
  imports: [NzBreadCrumbComponent, NzBreadCrumbItemComponent]
});
var NzBreadCrumbModule = _NzBreadCrumbModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NzBreadCrumbModule, [{
    type: NgModule,
    args: [{
      imports: [NzBreadCrumbComponent, NzBreadCrumbItemComponent, NzBreadCrumbSeparatorComponent],
      exports: [NzBreadCrumbComponent, NzBreadCrumbItemComponent, NzBreadCrumbSeparatorComponent]
    }]
  }], null, null);
})();
export {
  NzBreadCrumbComponent,
  NzBreadCrumbItemComponent,
  NzBreadCrumbModule,
  NzBreadCrumbSeparatorComponent
};
//# sourceMappingURL=ng-zorro-antd_breadcrumb.js.map
