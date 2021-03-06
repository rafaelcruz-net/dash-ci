﻿/// <reference path="../models/widgets.ts" />

namespace DashCI.Widgets {

    export class LoaderDirective implements ng.IDirective {

        static create(): ng.IDirectiveFactory {
            const directive: ng.IDirectiveFactory =
                ($compile: ng.ICompileService, widgets: Models.IWidgetDescription[]) => new LoaderDirective($compile, widgets);
            directive.$inject = ["$compile", "widgets"];
            return directive;
        }


        constructor(
            private $compile: ng.ICompileService,
            private widgets: Models.IWidgetDescription[]
        ) { }

        public scope = { scope: '=', editable: '=', globalOptions: '=' };
        public restrict = "E";
        public replace = true;
        public link: ng.IDirectiveLinkFn = ($scope: ng.IScope, $element: JQuery, attrs: angular.IAttributes, ctrl: angular.INgModelController) => {
            var widgetParam = (<any>$scope).scope;

            var wscope = <Models.IWidgetScope>$scope.$new();
            angular.extend(wscope, {
                data: widgetParam
            });

            var wdesc = this.widgets.filter((item) => item.type == wscope.data.type)[0];


            var el = this.$compile("<" + (wdesc.directive || Models.WidgetType[wdesc.type]) + ' class="widget {{data.color}}" />')(wscope);
            wscope.$element = el;
            $element.replaceWith(el);

            $scope.$watch(() => (<any>$scope).editable, () => wscope.editable = (<any>$scope).editable);
            $scope.$watch(() => (<any>$scope).globalOptions, () => wscope.globalOptions = (<any>$scope).globalOptions);
        }
    }
    DashCI.app.directive("widgetLoader", LoaderDirective.create());
}