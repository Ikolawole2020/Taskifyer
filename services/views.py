from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import Category, Service
from .serializers import CategorySerializer, ServiceSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().select_related('category', 'provider__user')
    serializer_class = ServiceSerializer

    def get_queryset(self):
        user = self.request.user
        mine = self.request.query_params.get('mine')

        # When a provider is managing their own services, show ALL (active + inactive)
        if mine == 'true' and user.is_authenticated and getattr(user, 'role', None) == 'PROVIDER':
            return Service.objects.filter(
                provider__user=user
            ).select_related('category', 'provider__user')

        # For public list / search → only show active services
        queryset = Service.objects.filter(is_active=True).select_related(
            'category', 'provider__user'
        )

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )

        return queryset

    def get_object(self):
        """
        Allow providers to retrieve their own inactive services
        (needed for edit / reactivate)
        """
        # First try the normal queryset
        try:
            return super().get_object()
        except Exception:
            pass

        # If not found, check if it belongs to the current provider
        user = self.request.user
        if user.is_authenticated and getattr(user, 'role', None) == 'PROVIDER':
            from rest_framework.exceptions import NotFound
            try:
                obj = Service.objects.select_related('category', 'provider__user').get(
                    pk=self.kwargs['pk'],
                    provider__user=user
                )
                return obj
            except Service.DoesNotExist:
                raise NotFound()
        
        from rest_framework.exceptions import NotFound
        raise NotFound()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user.provider_profile)

    def perform_update(self, serializer):
        service = self.get_object()
        if service.provider.user != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own services")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.provider.user != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own services")
        instance.delete()