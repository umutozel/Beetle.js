﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Beetle.Meta;
using Microsoft.AspNetCore.Mvc;

namespace Beetle.MvcCore {
    using Server;
    using Server.Interface;
    using ServerHelper = Server.Helper;

    public abstract class BeetleController<TContextHandler> : BeetleController, IBeetleService<TContextHandler>
        where TContextHandler : class, IContextHandler {

        protected BeetleController(TContextHandler contextHandler)
            : this(contextHandler, null) {
        }

        protected BeetleController(TContextHandler contextHandler, IBeetleConfig config) : base(config) {
            if (ContextHandler == null)
                throw new ArgumentNullException(nameof(contextHandler));

            ContextHandler = contextHandler;
        }

        public TContextHandler ContextHandler { get; }

        IContextHandler IBeetleService.ContextHandler => ContextHandler;
    }

    [BeetleActionFilter]
    public abstract class BeetleController : ControllerBase, IBeetleService {

        protected BeetleController() : this(null) {
        }

        protected BeetleController(IBeetleConfig config) {
            Config = config;
        }

        protected bool AutoHandleUnknownActions { get; set; }

        protected virtual Metadata GetMetadata() {
            var svc = (IBeetleService)this;
            return svc.ContextHandler?.Metadata();
        }

        [BeetleActionFilter(typeof(SimpleResultConfig))]
        public virtual object Metadata() {
            return GetMetadata()?.ToMinified();
        }

        public override NotFoundResult NotFound() {
            var action = ControllerContext.ActionDescriptor.ActionName;

            if (AutoHandleUnknownActions) {
                var contextHandler = ((IBeetleService)this).ContextHandler;
                if (contextHandler == null)
                    throw new NotSupportedException();

                var result = contextHandler.HandleUnknownAction(action);
                Helper.GetParameters(Config, Request, out string queryString, out IList<BeetleParameter> parameters);

                var actionContext = new ActionContext(
                    action, result, queryString, parameters,
                    MaxResultCount, CheckRequestHash, null, this
                );
                var processResult = ProcessRequest(actionContext);
                Helper.SetCustomHeaders(processResult, Response);
                var response = Helper.HandleResponse(processResult, Response);
                response.ExecuteResult(ControllerContext);
            }

            return base.NotFound();
        }

        protected virtual IList<EntityBag> ResolveEntities(object saveBundle,
            out IList<EntityBag> unknownEntities) {
            return ServerHelper.ResolveEntities(saveBundle, Config, GetMetadata(), out unknownEntities);
        }

        protected virtual IEnumerable<EntityBag> HandleUnknowns(IEnumerable<EntityBag> unknowns) {
            return Enumerable.Empty<EntityBag>();
        }

        protected virtual Task<SaveResult> SaveChanges(SaveContext saveContext) {
            var svc = (IBeetleService)this;
            return svc.ContextHandler?.SaveChanges(saveContext)
                   ?? throw new NotSupportedException();
        }

        #region Implementation of IBeetleService

        public virtual IBeetleConfig Config { get; }

        IContextHandler IBeetleService.ContextHandler => null;

        public int? MaxResultCount { get; set; }

        public bool CheckRequestHash { get; set; }

        Metadata IBeetleService.Metadata() {
            return GetMetadata();
        }

        public virtual object CreateType(string typeName, string initialValues) {
            return ServerHelper.CreateType(typeName, initialValues, Config);
        }

        ProcessResult IBeetleService.ProcessRequest(ActionContext actionContext) {
            return ProcessRequest(actionContext);
        }

        protected virtual ProcessResult ProcessRequest(ActionContext actionContext) {
            var svc = (IBeetleService)this;
            return svc.ContextHandler != null
                ? svc.ContextHandler.ProcessRequest(actionContext)
                : ServerHelper.DefaultRequestProcessor(actionContext);
        }

        public async Task<SaveResult> SaveChanges(object saveBundle) {
            var entityBags = ResolveEntities(saveBundle, out IList<EntityBag> unknowns);
            var entityBagList = entityBags == null
                ? new List<EntityBag>()
                : entityBags as List<EntityBag> ?? entityBags.ToList();

            var handledUnknowns = HandleUnknowns(unknowns);
            if (handledUnknowns != null) {
                entityBagList.AddRange(handledUnknowns);
            }
            if (!entityBagList.Any()) return SaveResult.Empty;

            var saveContext = new SaveContext(entityBagList);
            OnBeforeSaveChanges(new BeforeSaveEventArgs(saveContext));
            var retVal = await SaveChanges(saveContext);
            OnAfterSaveChanges(new AfterSaveEventArgs(retVal));

            return retVal;
        }

        #region Event-Handlers

        public event BeforeQueryExecuteDelegate BeforeHandleQuery;

        void IBeetleService.OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            OnBeforeHandleQuery(args);
        }

        protected virtual void OnBeforeHandleQuery(BeforeQueryExecuteEventArgs args) {
            BeforeHandleQuery?.Invoke(this, args);
        }

        public event BeforeQueryExecuteDelegate BeforeQueryExecute;

        void IBeetleService.OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            OnBeforeQueryExecute(args);
        }

        protected virtual void OnBeforeQueryExecute(BeforeQueryExecuteEventArgs args) {
            BeforeQueryExecute?.Invoke(this, args);
        }

        public event AfterQueryExecuteDelegate AfterQueryExecute;

        void IBeetleService.OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            OnAfterQueryExecute(args);
        }

        protected virtual void OnAfterQueryExecute(AfterQueryExecuteEventArgs args) {
            AfterQueryExecute?.Invoke(this, args);
        }

        public event BeforeSaveDelegate BeforeSaveChanges;

        protected virtual void OnBeforeSaveChanges(BeforeSaveEventArgs args) {
            BeforeSaveChanges?.Invoke(this, args);
        }

        public event AfterSaveDelegate AfterSaveChanges;

        protected virtual void OnAfterSaveChanges(AfterSaveEventArgs args) {
            AfterSaveChanges?.Invoke(this, args);
        }

        #endregion

        #endregion
    }
}
